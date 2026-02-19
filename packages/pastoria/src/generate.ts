/**
 * @fileoverview Router Code Generator
 *
 * This script generates type-safe router configuration files by scanning TypeScript
 * source code for JSDoc annotations. It's part of the "Pastoria" routing framework.
 *
 * How it works:
 * 1. Scans all TypeScript files in the project for exported functions/classes
 * 2. Looks for JSDoc tags: @route, @resource, @appRoot, and @param
 * 3. Looks for exported classes that extend PastoriaRootContext for GraphQL context
 * 4. Generates files from templates:
 *    - js_resource.ts: Resource configuration for lazy loading
 *    - router.tsx: Client-side router with type-safe routes
 *
 * Usage:
 * - Add @route <route-name> to functions to create routes
 * - Add @param <name> <type> to document route parameters
 * - Add @resource <resource-name> to exports for lazy loading
 * - Add #pastoria/app.tsx to create a wrapper component for the app
 * - Add #pastoria/environment.ts to configure the application
 * - Add page.tsx files to #pastoria to create new routes
 *
 * The generator automatically creates Zod schemas for route parameters based on
 * TypeScript types, enabling runtime validation and type safety.
 */

import * as path from 'node:path';
import pc from 'picocolors';
import {
  CodeBlockWriter,
  ExportedDeclarations,
  ImportDeclarationStructure,
  OptionalKind,
  Project,
  PropertyAssignmentStructure,
  SourceFile,
  SyntaxKind,
  ts,
  TypeFlags,
  VariableDeclarationKind,
} from 'ts-morph';
import {saveWithChecksum} from './fs.js';
import {logInfo, logWarn} from './logger.js';
import {PastoriaMetadata, RouterResource, ServerRoute} from './metadata.js';

/**
 * Collects all parameters used by `queries` represents as `ts.Type`.
 *
 * In the case of a conflict, later queries veriables win.
 */
function collectQueryParameters(
  project: Project,
  queries: string[],
): Map<string, ts.Type> {
  const vars = new Map<string, ts.Type>();

  for (const query of queries) {
    const variablesType = project
      .getSourceFile(`__generated__/queries/${query}.graphql.ts`)
      ?.getExportedDeclarations()
      .get(`${query}$variables`)
      ?.at(0)
      ?.getType();

    if (variablesType == null) continue;

    for (const property of variablesType.getProperties()) {
      // TODO: Detect conflicting types among properties declared.
      const propertyName = property.getName();
      const propertyType = property.getValueDeclaration()?.getType();

      if (propertyType) {
        vars.set(propertyName, propertyType.compilerType);
      }
    }
  }

  return vars;
}

/**
 * Creates a Zod schema for a given ts.Type.
 *
 * @param sf Source file that the schema will be inserted in. Used for finding relative import paths.
 * @param tc Type checker instance associated with the project.
 * @param t Tpye to generate a schema for.
 * @returns String representation of the generated Zod schema.
 */
function zodSchemaOfType(
  sf: SourceFile,
  tc: ts.TypeChecker,
  t: ts.Type,
): string {
  if (t.aliasSymbol) {
    const decl = t.aliasSymbol.declarations?.at(0);
    if (decl == null) {
      logWarn('Could not handle type:', tc.typeToString(t));
      return `z.any()`;
    } else {
      const importPath = sf.getRelativePathAsModuleSpecifierTo(
        decl.getSourceFile().fileName,
      );

      return `z.transform((s: string) => s as import('${importPath}').${t.aliasSymbol.getName()})`;
    }
  } else if (t.getFlags() & TypeFlags.String) {
    return `z.pipe(z.string(), z.transform(decodeURIComponent))`;
  } else if (t.getFlags() & TypeFlags.Number) {
    return `z.coerce.number<number>()`;
  } else if (t.getFlags() & TypeFlags.Null) {
    return `z.preprocess(s => s == null ? undefined : s, z.undefined())`;
  } else if (t.isUnion()) {
    const nullishTypes: ts.Type[] = [];
    const nonNullishTypes: ts.Type[] = [];
    for (const s of t.types) {
      const flags = s.getFlags();
      if (flags & TypeFlags.Null || flags & TypeFlags.Undefined) {
        nullishTypes.push(s);
      } else {
        nonNullishTypes.push(s);
      }
    }

    if (nullishTypes.length > 0 && nonNullishTypes.length > 0) {
      const nonOptionalType = t.getNonNullableType();
      return `z.pipe(z.nullish(${zodSchemaOfType(sf, tc, nonOptionalType)}), z.transform(s => s == null ? undefined : s))`;
    } else {
      return `z.union([${t.types.map((it) => zodSchemaOfType(sf, tc, it)).join(', ')}])`;
    }
  } else if (tc.isArrayLikeType(t)) {
    const typeArg = tc.getTypeArguments(t as ts.TypeReference)[0];
    const argZodSchema =
      typeArg == null ? `z.any()` : zodSchemaOfType(sf, tc, typeArg);

    return `z.array(${argZodSchema})`;
  } else {
    logWarn('Could not handle type:', tc.typeToString(t));
    return `z.any()`;
  }
}

function escapeResourceName(routeName: string): string {
  return routeName
    .replace(/\[(\w+)\]/g, '$$$1')
    .replace(/\//g, '_')
    .replace(/^_/, '')
    .replace(/_$/, '');
}

function getSchemaCode(
  pageSourceFile: SourceFile,
  targetSourceFile: SourceFile,
  tc: ts.TypeChecker,
  params: Map<string, ts.Type>,
): string {
  // Try to copy schema from page.tsx if it exists
  const schemaDecl = pageSourceFile
    .getExportedDeclarations()
    .get('schema')
    ?.at(0);

  if (schemaDecl?.isKind(SyntaxKind.VariableDeclaration)) {
    const initializer = schemaDecl.getInitializer();
    if (initializer) {
      return initializer.getText();
    }
  }

  // Fallback: generate from query variable types
  if (params.size === 0) {
    return 'z.object({})';
  }

  const properties = Array.from(params)
    .map(
      ([name, type]) =>
        `${name}: ${zodSchemaOfType(targetSourceFile, tc, type)}`,
    )
    .join(', ');

  return `z.object({${properties}})`;
}

export class PastoriaExecutionContext {
  static TEMPLATES_DIRECTORY = path.join(import.meta.dirname, '../templates');

  private readonly metadata: PastoriaMetadata;

  constructor(
    private readonly project: Project,
    private readonly templatesDir = PastoriaExecutionContext.TEMPLATES_DIRECTORY,
    private readonly projectDir = process.cwd(),
  ) {
    this.metadata = new PastoriaMetadata(project, projectDir);
  }

  private async loadRouterTemplate(filename: string) {
    const templatePath = path.join(this.templatesDir, filename);
    const outputPath = path.join('__generated__/router', filename);

    const template = await this.getFileSystem().readFile(templatePath);
    const warningComment = `/*
 * This file was generated by \`pastoria\`.
 * Do not modify this file directly. Instead, edit the template at ${path.basename(templatePath)}.
 */

`;

    return this.project.createSourceFile(
      outputPath,
      warningComment + template,
      {
        overwrite: true,
      },
    );
  }

  private getTypeChecker() {
    return this.project.getTypeChecker().compilerObject;
  }

  private getFileSystem() {
    return this.project.getFileSystem();
  }

  /** Returns relative path of a file from the project root. This is typically one level above #pastoria. */
  private relativePathFromRoot(sourceFile: SourceFile) {
    return path.relative(this.projectDir, sourceFile.getFilePath());
  }

  /** Returns relative path of a file from the #pastoria root. */
  private relativePathFromPastoria(sourceFile: SourceFile) {
    return path.relative(
      path.join(this.projectDir, 'pastoria'),
      sourceFile.getFilePath(),
    );
  }

  /** Determines if a file generates a React route, e.g. is a page.tsx. */
  private isRoutablePageFile(sourceFile: SourceFile) {
    const pastoriaPath = this.relativePathFromPastoria(sourceFile);
    return path.basename(pastoriaPath) === 'page.tsx';
  }

  /** Returns a human-friendly generated abstract resource name for a source file under #pastoria. */
  private resourceNameForPastoriaSourceFile(sourceFile: SourceFile) {
    const pastoriaPath = this.relativePathFromPastoria(sourceFile);
    let routableName = '/' + path.dirname(pastoriaPath);

    // Handle #pastoria/page.tsx as just /.
    if (routableName === '/.') routableName = '/';

    if (this.isRoutablePageFile(sourceFile)) {
      return routableName;
    } else {
      return `${routableName}#${path.basename(pastoriaPath, '.tsx')}`;
    }
  }

  /**
   * Returns an absolute module specifier for a source file under #pastoria, e.g. #pastoria/route/[details]/page.
   */
  private moduleNameForPastoriaSourceFile(sourceFile: SourceFile) {
    const pastoriaPath = this.relativePathFromPastoria(sourceFile);
    return path.join(
      '#pastoria',
      path.dirname(pastoriaPath),
      path.basename(pastoriaPath, path.extname(pastoriaPath)),
    );
  }

  private entryPointFileNameForResource(sourceFile: SourceFile) {
    const resourceName = this.moduleNameForPastoriaSourceFile(sourceFile);
    const escapedName = escapeResourceName(
      resourceName.replace('#pastoria/', ''),
    );
    return escapedName + '.entrypoint.ts';
  }

  async generatePastoriaArtifacts() {
    // TODO: Add sanity checks that #pastoria/app.tsx and #pastoria/environment.ts exist.
    await Promise.all([
      this.generateRouter(),
      this.generateJsResource(),
      this.generateServer(),
      this.generateEntryPointFiles(),
      this.generateHelperTypes(),
    ]);
  }

  private async generateRouter() {
    const {entryPointRoutes, routes, resources, resourceSourceFiles} =
      this.metadata;

    const routerTemplate = await this.loadRouterTemplate('router.tsx');
    const tc = this.getTypeChecker();

    const routerSchema = routerTemplate
      .getVariableDeclarationOrThrow('ROUTER_SCHEMA')
      .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    const routerConf = routerTemplate
      .getVariableDeclarationOrThrow('ROUTER_CONF')
      .getInitializerIfKindOrThrow(SyntaxKind.AsExpression)
      .getExpressionIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    const routeMapping = routerTemplate
      .getVariableDeclarationOrThrow('ROUTE_MAPPING')
      .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    routerSchema.getPropertyOrThrow('noop').remove();
    routerConf.getPropertyOrThrow('noop').remove();

    // Legacy @route entry point generation.
    let entryPointImportIndex = 0;
    for (let [routeName, {sourceFile, symbol, params}] of routes.entries()) {
      const filePath = this.relativePathFromRoot(sourceFile);
      let entryPointExpression: string;

      // Resource-routes are combined declarations of a resource and a route
      // where we should generate the entrypoint for the route.
      const isResourceRoute = Array.from(resources.entries()).find(
        ([, {symbol: resourceSymbol}]) => symbol === resourceSymbol,
      );

      if (isResourceRoute) {
        const [resourceName, resource] = isResourceRoute;
        const entryPointFunctionName = `entrypoint_${resourceName.replace(/\W/g, '')}`;

        const consumedQueries = new Set<string>();
        routerTemplate.addFunction({
          name: entryPointFunctionName,
          returnType: `EntryPoint<ModuleType<'${resourceName}'>, EntryPointParams<'${routeName}'>>`,
          statements: (writer) => {
            writer.write('return ').block(() => {
              this.writeLegacyEntryPoint(
                writer,
                consumedQueries,
                routeName,
                resourceName,
                resource,
              );
            });
          },
        });

        if (params.size === 0 && consumedQueries.size > 0) {
          params = collectQueryParameters(
            this.project,
            Array.from(consumedQueries),
          );
        }

        for (const query of consumedQueries) {
          routerTemplate.addImportDeclaration({
            moduleSpecifier: `#genfiles/queries/${query}$parameters`,
            defaultImport: `${query}Parameters`,
          });
        }

        entryPointExpression = entryPointFunctionName + '()';
      } else {
        const importAlias = `e${entryPointImportIndex++}`;
        const moduleSpecifier =
          routerTemplate.getRelativePathAsModuleSpecifierTo(
            sourceFile.getFilePath(),
          );

        routerTemplate.addImportDeclaration({
          moduleSpecifier,
          namedImports: [
            {
              name: symbol.getName(),
              alias: importAlias,
            },
          ],
        });

        entryPointExpression = importAlias;
      }

      routerSchema.addPropertyAssignment({
        name: `"${routeName}"`,
        initializer: (writer) => {
          if (params.size === 0) {
            writer.write(`z.object({})`);
          } else {
            writer.writeLine(`z.object({`);
            for (const [paramName, paramType] of Array.from(params)) {
              writer.writeLine(
                `  ${paramName}: ${zodSchemaOfType(routerTemplate, tc, paramType)},`,
              );
            }

            writer.writeLine('})');
          }
        },
      });

      routerConf.addPropertyAssignment({
        name: `"${routeName}"`,
        initializer: (writer) => {
          writer
            .write('{')
            .indent(() => {
              writer.writeLine(`entrypoint: ${entryPointExpression},`);
              writer.writeLine(`schema: ROUTER_SCHEMA["${routeName}"]`);
            })
            .write('} as const');
        },
      });

      routeMapping.addPropertyAssignment({
        name: `"${routeName}"`,
        initializer: `ROUTER_CONF["${routeName}"]`,
      });

      logInfo(
        'Created route',
        pc.cyan(routeName),
        'for',
        pc.green(symbol.getName()),
        'exported from',
        pc.yellow(filePath),
      );
    }

    const importDeclarations: OptionalKind<ImportDeclarationStructure>[] = [];
    const routerConfProperties: OptionalKind<PropertyAssignmentStructure>[] =
      [];
    const routerMappingProperties: OptionalKind<PropertyAssignmentStructure>[] =
      [];

    // Newer file-based routing generation.
    for (const {routeName, routePath, sourceFile} of entryPointRoutes) {
      const escapedRouteName = escapeResourceName(routeName);
      importDeclarations.push({
        moduleSpecifier: routerTemplate.getRelativePathAsModuleSpecifierTo(
          this.entryPointFileNameForResource(sourceFile),
        ),
        namedImports: [
          {
            name: 'schema',
            alias: `${escapedRouteName}_EP_schema`,
          },
          {
            name: 'entrypoint',
            alias: `${escapedRouteName}_EP_entrypoint`,
          },
        ],
      });

      routerConfProperties.push({
        name: `"${routeName}"`,
        initializer: (writer) => {
          writer
            .write('{')
            .indent(() => {
              writer.writeLine(
                `entrypoint: ${escapedRouteName}_EP_entrypoint,`,
              );
              writer.writeLine(`schema: ${escapedRouteName}_EP_schema,`);
            })
            .write('} as const');
        },
      });

      routerMappingProperties.push({
        name: `"${routePath}"`,
        initializer: `ROUTER_CONF["${routeName}"]`,
      });

      logInfo('Created route', pc.cyan(routeName));
    }

    routerTemplate.addImportDeclarations(importDeclarations);
    routerConf.addPropertyAssignments(routerConfProperties);
    routeMapping.addPropertyAssignments(routerMappingProperties);

    await saveWithChecksum(routerTemplate);
  }

  private async generateJsResource() {
    const {resources} = this.metadata;
    const jsResourceTemplate = await this.loadRouterTemplate('js_resource.ts');

    const resourceConf = jsResourceTemplate
      .getVariableDeclarationOrThrow('RESOURCE_CONF')
      .getInitializerIfKindOrThrow(SyntaxKind.AsExpression)
      .getExpressionIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    resourceConf.getPropertyOrThrow('noop').remove();

    // Legacy @resource-style declarations.
    for (const [resourceName, {sourceFile, symbol}] of resources.entries()) {
      const filePath = this.relativePathFromRoot(sourceFile);
      const moduleSpecifier =
        jsResourceTemplate.getRelativePathAsModuleSpecifierTo(
          sourceFile.getFilePath(),
        );

      resourceConf.addPropertyAssignment({
        name: `"${resourceName}"`,
        initializer: (writer) => {
          writer.block(() => {
            writer
              .writeLine(`src: "${filePath}",`)
              .writeLine(
                `loader: () => import("${moduleSpecifier}").then(m => m.${symbol.getName()})`,
              );
          });
        },
      });

      logInfo(
        'Created resource',
        pc.cyan(resourceName),
        'for',
        pc.green(symbol.getName()),
        'exported from',
        pc.yellow(filePath),
      );
    }

    const resourceConfProperies: OptionalKind<PropertyAssignmentStructure>[] =
      [];

    for (const sourceFile of this.metadata.resourceSourceFiles) {
      resourceConfProperies.push({
        name: `"${this.resourceNameForPastoriaSourceFile(sourceFile)}"`,
        initializer: (writer) => {
          writer.block(() => {
            writer.writeLine(
              `src: "${this.relativePathFromRoot(sourceFile)}",`,
            );
            writer.writeLine(
              `loader: () => import("${this.moduleNameForPastoriaSourceFile(sourceFile)}").then(m => m.default),`,
            );
          });
        },
      });
    }

    resourceConf.addPropertyAssignments(resourceConfProperies);
    await saveWithChecksum(jsResourceTemplate);
  }

  private async generateServer() {
    const {serverRoutes} = this.metadata;
    const serverTemplate = await this.loadRouterTemplate('server.ts');

    const importDeclarations: OptionalKind<ImportDeclarationStructure>[] = [];
    const statements: string[] = [];

    let serverHandlerImportIndex = 0;
    for (const {symbol, sourceFile, routeName, routePath} of serverRoutes) {
      const importAlias = `e${serverHandlerImportIndex++}`;
      const filePath = this.relativePathFromRoot(sourceFile);
      const moduleSpecifier = serverTemplate.getRelativePathAsModuleSpecifierTo(
        sourceFile.getFilePath(),
      );

      importDeclarations.push({
        moduleSpecifier,
        namedImports: [{name: symbol.getName(), alias: importAlias}],
      });

      statements.push(`router.use('${routePath}', ${importAlias})`);

      logInfo(
        'Created server route',
        pc.cyan(routeName),
        'for',
        pc.yellow(filePath),
      );
    }

    serverTemplate.addImportDeclarations(importDeclarations);
    serverTemplate.addStatements(statements);
    await saveWithChecksum(serverTemplate);
  }

  private async generateHelperTypes() {
    const {resourceSourceFiles} = this.metadata;
    if (resourceSourceFiles.length === 0) {
      // TODO: delete the source file if we're not generating any helper types.
      return;
    }

    // Create source file with header comment
    const warningComment = `/*
 * This file was generated by \`pastoria\`.
 * Do not modify this file directly.
 */

`;
    const helperTypesTemplate = this.project.createSourceFile(
      '__generated__/router/types.ts',
      warningComment,
      {overwrite: true},
    );

    const importDeclarations: OptionalKind<ImportDeclarationStructure>[] = [
      {
        moduleSpecifier: 'react-relay/hooks',
        namedImports: ['EntryPointProps', 'PreloadProps'],
        isTypeOnly: true,
      },
      {
        moduleSpecifier: 'zod/v4-mini',
        namedImports: ['z'],
        isTypeOnly: true,
      },
    ];

    const pageTypeHelpers: {
      routeName: string;
      escapedResourceName: string;
    }[] = [];

    for (const sourceFile of resourceSourceFiles) {
      const entryPointFileName = path.basename(
        this.entryPointFileNameForResource(sourceFile),
        '.ts',
      );

      const escapedResourceName = path.basename(
        entryPointFileName,
        '.entrypoint',
      );

      importDeclarations.push({
        moduleSpecifier: `./${entryPointFileName}`,
        isTypeOnly: true,
        namedImports: [
          {name: 'Queries', alias: `${escapedResourceName}_EP_Queries`},
          {name: 'EntryPoints', alias: `${escapedResourceName}_EP_EntryPoints`},
          {name: 'schema', alias: `${escapedResourceName}_EP_schema`},
          {
            name: 'PreloadPropsHelpers',
            alias: `${escapedResourceName}_EP_PreloadPropsHelpers`,
          },
        ],
      });

      pageTypeHelpers.push({
        routeName: this.resourceNameForPastoriaSourceFile(sourceFile),
        escapedResourceName,
      });
    }

    helperTypesTemplate.addImportDeclarations(importDeclarations);
    helperTypesTemplate.addStatements(`
declare global {
  type PastoriaRouteName =
    ${pageTypeHelpers.map((r) => `| '${r.routeName}'`).join('    \n')};

  type PastoriaPageQueries = {
    ${pageTypeHelpers.map((r) => `['${r.routeName}']: ${r.escapedResourceName}_EP_Queries`)},
  };

  type PastoriaPageEntryPoints = {
    ${pageTypeHelpers.map((r) => `['${r.routeName}']: ${r.escapedResourceName}_EP_EntryPoints`)},
  };

  type PastoriaPageProps<T extends PastoriaRouteName> = EntryPointProps<
    PastoriaPageQueries[T],
    PastoriaPageEntryPoints[T],
    {},
    {}
  >;

  type PastoriaPreloadPropsParams = {
    ${pageTypeHelpers.map((r) => `['${r.routeName}']: z.output<typeof ${r.escapedResourceName}_EP_schema>`)},
  };

  type PastoriaPreloadPropsHelpers = {
    ${pageTypeHelpers.map((r) => `['${r.routeName}']: ${r.escapedResourceName}_EP_PreloadPropsHelpers`)}
  };

  type GetPreloadProps<R extends PastoriaRouteName> = (params: PastoriaPreloadPropsHelpers[R]) =>
    PreloadProps<PastoriaPreloadPropsParams[R], PastoriaPageQueries[R], PastoriaPageEntryPoints[R], {}>
}
`);

    await saveWithChecksum(helperTypesTemplate);
    logInfo('Created page helper types');
  }

  private async generateEntryPointFiles() {
    const expectedFiles = new Set(
      await Promise.all(
        this.metadata.resourceSourceFiles.map((sourceFile) =>
          this.generateSingleEntryPointFile(sourceFile),
        ),
      ),
    );

    // Delete stale entrypoint files that no longer correspond to a resource
    const generatedDir = path.resolve(this.projectDir, '__generated__/router');
    try {
      const entries = this.getFileSystem().readDirSync(generatedDir);
      for (const entry of entries) {
        if (
          entry.isFile &&
          entry.name.endsWith('.entrypoint.ts') &&
          !expectedFiles.has(path.basename(entry.name))
        ) {
          this.getFileSystem().deleteSync(entry.name);
          logWarn(
            'Removed stale entrypoint',
            pc.cyan(path.basename(entry.name)),
          );
        }
      }
    } catch {
      // Directory may not exist yet on first run
    }
  }

  private async generateSingleEntryPointFile(entryPointSourceFile: SourceFile) {
    const resourceName =
      this.resourceNameForPastoriaSourceFile(entryPointSourceFile);
    const fileName = this.entryPointFileNameForResource(entryPointSourceFile);

    // Create source file with header comment
    const warningComment = `/*
 * This file was generated by \`pastoria\`.
 * Do not modify this file directly.
 */

`;
    const sourceFile = this.project.createSourceFile(
      path.join('__generated__/router', fileName),
      warningComment,
      {overwrite: true},
    );

    // Extract Queries type from page.tsx to get query names
    const queriesType = entryPointSourceFile
      .getExportedDeclarations()
      .get('Queries')
      ?.at(0)
      ?.getType();

    // Build queries map: {queryRef -> queryTypeName}
    const queries = new Map<string, string>();
    queriesType?.getProperties().forEach((prop) => {
      const queryName = prop
        .getValueDeclaration()
        ?.getType()
        .getAliasSymbol()
        ?.getName();
      if (queryName) {
        queries.set(prop.getName(), queryName);
      }
    });

    // Collect parameters from query variables
    const params = collectQueryParameters(
      this.project,
      Array.from(queries.values()),
    );

    const exportedDecls = entryPointSourceFile.getExportedDeclarations();
    const hasQueriesExport = exportedDecls.has('Queries');
    const hasEntryPointsExport = exportedDecls.has('EntryPoints');

    // Import only the types that are actually exported from page.tsx
    const pageTypeImports: string[] = [];
    if (hasEntryPointsExport) pageTypeImports.push('EntryPoints');
    if (hasQueriesExport) pageTypeImports.push('Queries');

    const importDeclarations: OptionalKind<ImportDeclarationStructure>[] = [];

    if (pageTypeImports.length > 0) {
      const moduleSpecifier =
        sourceFile.getRelativePathAsModuleSpecifierTo(entryPointSourceFile);

      importDeclarations.push({
        moduleSpecifier,
        namedImports: pageTypeImports,
        isTypeOnly: true,
      });
    }

    importDeclarations.push({
      moduleSpecifier: 'react-relay/hooks',
      namedImports: ['EntryPoint', 'ThinQueryParams'],
    });

    importDeclarations.push({
      moduleSpecifier: 'zod/v4-mini',
      namedImports: ['z'],
    });

    importDeclarations.push({
      moduleSpecifier: './js_resource',
      namedImports: ['JSResource', 'ModuleType'],
    });

    // Generate schema - prefer copying from page.tsx if exported
    const tc = this.getTypeChecker();
    // TODO: Copy the original page file and remove everything but `schema` and the variables it uses.
    const schemaCode = getSchemaCode(
      entryPointSourceFile,
      sourceFile,
      tc,
      params,
    );

    sourceFile.addVariableStatements([
      {
        declarations: [
          {
            name: 'schema',
            initializer: schemaCode,
          },
        ],
        isExported: false,
        declarationKind: VariableDeclarationKind.Const,
        trailingTrivia: '\n\n',
      },
      {
        declarations: [
          {
            name: 'entrypoint',
            type: `EntryPoint<ModuleType<'${resourceName}'>, z.output<typeof schema>>`,
            initializer: (writer) => {
              writer.block(() => {
                const getPreloadProps = exportedDecls
                  .get('getPreloadProps')
                  ?.at(0);

                if (getPreloadProps != null) {
                  this.writeStandaloneEntryPointWithPreloadProps(
                    writer,
                    resourceName,
                    getPreloadProps,
                    queries,
                  );
                } else {
                  this.writeStandaloneEntryPoint(writer, resourceName, queries);
                }
              });
            },
          },
        ],
        declarationKind: VariableDeclarationKind.Const,
        trailingTrivia: '\n\n',
      },
    ]);

    // Add query parameter imports after writeEntryPoint populates consumedQueries
    for (const queryName of queries.values()) {
      importDeclarations.push({
        moduleSpecifier: `#genfiles/queries/${queryName}$parameters`,
        defaultImport: `${queryName}Parameters`,
      });
    }

    const trailingStatements: string[] = [];

    // Generate fallback types for any missing exports
    if (!hasQueriesExport) {
      trailingStatements.push('\ntype Queries = {};\n');
    }
    if (!hasEntryPointsExport) {
      trailingStatements.push('\ntype EntryPoints = {};\n');
    }

    // PreloadPropsHelpers exports is used by PastoriaPreloadPropsParams in router.tsx as a helper
    // type for routes that overload and export getPreloadProps.
    trailingStatements.push(`\ntype PreloadPropsHelpers = {
  variables: z.output<typeof schema>,
  queries: {
    ${Array.from(queries.entries()).map(([queryAlias, queryName]) => {
      importDeclarations.push({
        moduleSpecifier: `#genfiles/queries/${queryName}.graphql`,
        namedImports: [queryName, `${queryName}$variables`],
        isTypeOnly: true,
      });

      return `${queryAlias}: (variables: ${queryName}$variables) => ThinQueryParams<${queryName}>`;
    })}
  },
};\n`);

    // Re-export the normalized types and schemas.
    trailingStatements.push(
      `\nexport {entrypoint, schema, type EntryPoints, type Queries, type PreloadPropsHelpers};\n`,
    );

    sourceFile.addImportDeclarations(importDeclarations);
    sourceFile.addStatements(trailingStatements);

    await saveWithChecksum(sourceFile);
    logInfo('Created entrypoint for', pc.cyan(resourceName));

    return fileName;
  }

  /**
   * Creates the body of an EntryPoint object for a given #pastoria-based route file.
   *
   * @param writer Writer instance to write to our code block.
   * @param resourceName Name of the JSResource of the root module.
   * @param queries Map of query reference name in the component to query name.
   */
  private writeStandaloneEntryPoint(
    writer: CodeBlockWriter,
    resourceName: string,
    queries: Map<string, string>,
  ) {
    writer.writeLine(`root: JSResource.fromModuleId('${resourceName}'),`);
    writer.write('getPreloadProps(variables)').block(() => {
      writer.write('return').block(() => {
        // Write the queries used by the entry point.
        writer.write('queries:').block(() => {
          for (const [queryRef, queryName] of queries) {
            const queryVars = collectQueryParameters(this.project, [queryName]);
            const hasVariables = queryVars.size > 0;

            writer.write(`${queryRef}:`).block(() => {
              // Parameters object generated by @preloadable tag on the query.
              writer.writeLine(`parameters: ${queryName}Parameters,`);
              // If the query has any variables, add them here. Each variable is written one-by one
              // to avoid spreading unused variables into any query.
              if (hasVariables) {
                const varNames = Array.from(queryVars.keys());
                writer.write(`variables: {`);
                writer.write(
                  varNames.map((v) => `${v}: variables.${v}`).join(', '),
                );
                writer.write(`}`);
              } else {
                // Query has no variables, pass empty object
                writer.write(`variables: {}`);
              }
              writer.newLine();
            });
            writer.write(',');
          }
        });
        writer.write(',');

        // Write any nested entry points used by our entry point.
        // TODO(ryan): Add the logic for this.
        writer.write('entryPoints:').block(() => {});
      });
    });
  }

  /**
   * Creates an entrypoint body for a route that has an exported getPreloadProps we should
   * use instead of the default generated one.
   */
  private writeStandaloneEntryPointWithPreloadProps(
    writer: CodeBlockWriter,
    resourceName: string,
    getPreloadProps: ExportedDeclarations,
    queries: Map<string, string>,
  ) {
    const getPreloadPropsFunctionExpression = getPreloadProps
      .asKind(SyntaxKind.VariableDeclaration)
      ?.getInitializer()
      ?.getText();

    if (getPreloadPropsFunctionExpression == null) {
      throw new Error(
        `Found exported getPreloadProps but wasn't a function expression.`,
      );
    }

    writer.writeLine(`root: JSResource.fromModuleId('${resourceName}'),`);
    writer.writeLine(`getPreloadProps($variables)`).block(() => {
      writer.writeLine(
        `return (${getPreloadPropsFunctionExpression})({
  variables: $variables,
  queries: {
    ${Array.from(queries).map(([queryAlias, queryName]) => {
      return `['${queryAlias}']: (variables) => ({
        parameters: ${queryName}Parameters,
        variables,
      })`;
    })}
  }
} satisfies PreloadPropsHelpers);`,
      );
    });
  }

  private writeLegacyEntryPoint(
    writer: CodeBlockWriter,
    consumedQueries: Set<string>,
    routeName: string,
    resourceName: string,
    resource: RouterResource,
    isRootEntryPoint = true,
  ) {
    writer.writeLine(`root: JSResource.fromModuleId('${resourceName}'),`);

    writer
      .write(`getPreloadProps(${isRootEntryPoint ? 'variables' : ''})`)
      .block(() => {
        writer.write('return').block(() => {
          writer
            .write('queries:')
            .block(() => {
              for (const [queryRef, query] of resource.queries.entries()) {
                consumedQueries.add(query);

                // Determine which variables this specific query needs
                const queryVars = collectQueryParameters(this.project, [query]);
                const hasVariables = queryVars.size > 0;

                writer
                  .write(`${queryRef}:`)
                  .block(() => {
                    writer.writeLine(`parameters: ${query}Parameters,`);

                    if (hasVariables) {
                      const varNames = Array.from(queryVars.keys());
                      // Always pick from the variables object
                      writer.write(`variables: {`);
                      writer.write(
                        varNames.map((v) => `${v}: variables.${v}`).join(', '),
                      );
                      writer.write(`}`);
                    } else {
                      // Query has no variables, pass empty object
                      writer.write(`variables: {}`);
                    }
                    writer.newLine();
                  })
                  .write(',');
              }
            })
            .writeLine(',');

          writer.write('entryPoints:').block(() => {
            for (const [
              epRef,
              subresourceName,
            ] of resource.entryPoints.entries()) {
              const subresource = this.metadata.resources.get(subresourceName);
              if (subresource) {
                writer
                  .write(`${epRef}:`)
                  .block(() => {
                    writer.writeLine(`entryPointParams: {},`);
                    writer.write('entryPoint:').block(() => {
                      this.writeLegacyEntryPoint(
                        writer,
                        consumedQueries,
                        routeName,
                        subresourceName,
                        subresource,
                        false,
                      );
                    });
                  })
                  .writeLine(',');
              }
            }
          });
        });
      });
  }
}
