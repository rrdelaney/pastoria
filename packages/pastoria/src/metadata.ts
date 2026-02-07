import * as path from 'node:path';
import pc from 'picocolors';
import {Project, SourceFile, Symbol, SyntaxKind, ts} from 'ts-morph';
import {logWarn} from './logger.js';

export interface ExportedSymbol {
  sourceFile: SourceFile;
  symbol: Symbol;
}

export interface RouterResource extends ExportedSymbol {
  queries: Map<string, string>;
  entryPoints: Map<string, string>;
}

export interface RouterRoute extends ExportedSymbol {
  params: Map<string, ts.Type>;
}

/**
 * A Pastoria API routes, defined as a default export in a route.ts file.
 */
export interface ServerRoute extends ExportedSymbol {
  /**
   * Name of the route as defined relative to pastoria/.
   *
   * For example, /api/greet/[name].
   */
  routeName: string;
  /**
   * Express-style path for the route.
   *
   * For example, /api/greet/:name
   */
  routePath: string;
}

/** Regex to quickly check if a file contains any Pastoria JSDoc tags. */
const PASTORIA_TAG_REGEX = /@(route|resource|param)\b/;

export class PastoriaMetadata {
  /** Planned for future removal. */
  readonly resources: Map<string, RouterResource>;
  /** Planned for future removal. */
  readonly routes: Map<string, RouterRoute>;
  readonly serverRoutes: ServerRoute[];
  readonly entryPointRoutes: ServerRoute[];

  constructor(project: Project, projectDir: string) {
    const {resources, routes} = collectLegecyPastoriaRoutesAndResources(
      project,
      projectDir,
    );
    this.resources = resources;
    this.routes = routes;

    this.serverRoutes = this.collectServerRoutes(project);
    this.entryPointRoutes = this.collectEntryPointRoutes(project);

    // Warn about conflicts between @route definitions and page.tsx entrypoints
    for (const epRoute of this.entryPointRoutes) {
      const existing = routes.get(epRoute.routeName);
      if (existing) {
        const existingFile = path.relative(
          projectDir,
          existing.sourceFile.getFilePath(),
        );
        const newFile = path.relative(
          projectDir,
          epRoute.sourceFile.getFilePath(),
        );
        logWarn(
          `Duplicate route ${pc.cyan(epRoute.routeName)}: defined via @route in ${pc.yellow(existingFile)} and via page.tsx in ${pc.yellow(newFile)}. The page.tsx definition will take precedence.`,
        );
      }
    }
  }

  private collectServerRoutes(project: Project): ServerRoute[] {
    const serverRoutes: ServerRoute[] = [];

    function visitSourceFile(sourceFile: SourceFile) {
      if (sourceFile.getBaseName() !== 'route.ts') return;

      const defaultExport = sourceFile.getDefaultExportSymbol();
      if (defaultExport == null) return;

      const routeName = project
        .getDirectory('pastoria')
        ?.getRelativePathTo(sourceFile.getDirectory());

      if (!routeName) return;

      serverRoutes.push({
        routeName: '/' + routeName,
        routePath: '/' + routeName.replace(/\[(\w+)\]/g, ':$1'),
        sourceFile,
        symbol: defaultExport,
      });
    }

    project.getSourceFiles('pastoria/**').forEach(visitSourceFile);
    return serverRoutes;
  }

  private collectEntryPointRoutes(project: Project): ServerRoute[] {
    const routes: ServerRoute[] = [];

    function visitSourceFile(sourceFile: SourceFile) {
      if (sourceFile.getBaseName() !== 'page.tsx') return;

      const defaultExport = sourceFile.getDefaultExportSymbol();
      if (defaultExport == null) return;

      const routeName = project
        .getDirectory('pastoria')
        ?.getRelativePathTo(sourceFile.getDirectory());

      if (!routeName) return;

      routes.push({
        routeName: '/' + routeName,
        routePath: '/' + routeName.replace(/\[(\w+)\]/g, ':$1'),
        sourceFile,
        symbol: defaultExport,
      });
    }

    project.getSourceFiles('pastoria/**').forEach(visitSourceFile);
    return routes;
  }
}

function collectLegecyPastoriaRoutesAndResources(
  project: Project,
  projectDir: string,
) {
  const resources = new Map<string, RouterResource>();
  const routes = new Map<string, RouterRoute>();

  function visitRouterNodes(sourceFile: SourceFile) {
    // Skip generated files
    if (sourceFile.getFilePath().includes('__generated__')) {
      return;
    }

    // Skip files that don't contain any Pastoria JSDoc tags
    const fileText = sourceFile.getFullText();
    if (!PASTORIA_TAG_REGEX.test(fileText)) {
      return;
    }

    sourceFile.getExportSymbols().forEach((symbol) => {
      let routerResource = null as [string, RouterResource] | null;
      let routerRoute = null as [string, RouterRoute] | null;
      const routeParams = new Map<string, ts.Type>();

      function visitJSDocTags(tag: ts.JSDoc | ts.JSDocTag) {
        if (ts.isJSDoc(tag)) {
          tag.tags?.forEach(visitJSDocTags);
        } else if (ts.isJSDocParameterTag(tag)) {
          const typeNode = tag.typeExpression?.type;
          const tc = project.getTypeChecker().compilerObject;

          const type =
            typeNode == null
              ? tc.getUnknownType()
              : tc.getTypeFromTypeNode(typeNode);

          routeParams.set(tag.name.getText(), type);
        } else if (typeof tag.comment === 'string') {
          switch (tag.tagName.getText()) {
            case 'route': {
              routerRoute = [
                tag.comment,
                {sourceFile, symbol, params: routeParams},
              ];
              break;
            }
            case 'resource': {
              routerResource = [
                tag.comment,
                {
                  sourceFile,
                  symbol,
                  queries: new Map(),
                  entryPoints: new Map(),
                },
              ];
              break;
            }
          }
        }
      }

      symbol
        .getDeclarations()
        .flatMap((decl) => ts.getJSDocCommentsAndTags(decl.compilerNode))
        .forEach(visitJSDocTags);

      if (routerRoute != null) {
        const [routeName, routeSymbol] = routerRoute;
        const existing = routes.get(routeName);
        if (existing) {
          const existingFile = path.relative(
            projectDir,
            existing.sourceFile.getFilePath(),
          );
          const newFile = path.relative(
            projectDir,
            routeSymbol.sourceFile.getFilePath(),
          );
          logWarn(
            `Duplicate @route ${pc.cyan(routeName)}: defined in both ${pc.yellow(existingFile)} and ${pc.yellow(newFile)}. Using the latter.`,
          );
        }
        routes.set(routeName, routeSymbol);

        const {entryPoints, queries} = getLegacyRouteQueriesAndEntryPoints(
          routeSymbol.symbol,
        );

        if (routerResource == null && (entryPoints.size || queries.size)) {
          resources.set(`route(${routeName})`, {
            ...routeSymbol,
            entryPoints,
            queries,
          });
        }
      }

      if (routerResource != null) {
        const [resourceName, resourceSymbol] = routerResource;
        const {entryPoints, queries} = getLegacyRouteQueriesAndEntryPoints(
          resourceSymbol.symbol,
        );

        resourceSymbol.queries = queries;
        resourceSymbol.entryPoints = entryPoints;
        resources.set(resourceName, resourceSymbol);
      }
    });
  }

  project.getSourceFiles().forEach(visitRouterNodes);

  return {resources, routes};
}

/**
 * Returns all routes and entry points used by a legacy @route definition.
 * Note this is not recursive into nested entrypoints.
 */
function getLegacyRouteQueriesAndEntryPoints(symbol: Symbol): {
  queries: Map<string, string>;
  entryPoints: Map<string, string>;
} {
  const resource = {
    queries: new Map<string, string>(),
    entryPoints: new Map<string, string>(),
  };

  const decl = symbol.getValueDeclaration();
  if (!decl) return resource;

  const t = decl.getType();
  const aliasSymbol = t.getAliasSymbol();

  if (aliasSymbol?.getName() === 'EntryPointComponent') {
    const [queries, entryPoints] = t.getAliasTypeArguments();

    queries?.getProperties().forEach((prop) => {
      const queryRef = prop.getName();
      const queryName = prop
        .getValueDeclaration()
        ?.getType()
        .getAliasSymbol()
        ?.getName();

      if (queryName) {
        resource.queries.set(queryRef, queryName);
      }
    });

    entryPoints?.getProperties().forEach((prop) => {
      const epRef = prop.getName();
      const entryPointTypeRef = prop
        .getValueDeclaration()
        ?.asKind(SyntaxKind.PropertySignature)
        ?.getTypeNode()
        ?.asKind(SyntaxKind.TypeReference);

      const entryPointTypeName = entryPointTypeRef?.getTypeName().getText();
      if (entryPointTypeName !== 'EntryPoint') {
        // TODO: Warn about found types not named EntryPoint
        return;
      }

      const entryPointInner = entryPointTypeRef?.getTypeArguments().at(0);
      const moduleTypeRef = entryPointInner?.asKind(SyntaxKind.TypeReference);
      if (moduleTypeRef != null) {
        const resourceName = moduleTypeRef
          ?.getTypeArguments()
          .at(0)
          ?.asKind(SyntaxKind.LiteralType)
          ?.getLiteral()
          .asKind(SyntaxKind.StringLiteral)
          ?.getLiteralText();

        if (resourceName) {
          resource.entryPoints.set(epRef, resourceName);
        }
      }
    });
  }

  return resource;
}
