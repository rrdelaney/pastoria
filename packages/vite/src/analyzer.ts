/**
 * @fileoverview Static analysis of a Pastoria app using the TypeScript 7 (tsgo) API.
 *
 * This is the only module that talks to TypeScript. It answers a small set of
 * questions about files under `pastoria/`, e.g. "what does this module export?"
 * and "what are the variables of this Relay query?", and hands back plain data
 * that the code generator turns into source text.
 *
 * Analysis deliberately never depends on files Pastoria itself generates, so the
 * results are stable regardless of the state of `__generated__/router`.
 */

import * as path from 'node:path';
import {
  isIdentifier,
  isInterfaceDeclaration,
  isLiteralTypeNode,
  isQualifiedName,
  isStringLiteral,
  isTypeAliasDeclaration,
  isTypeLiteralNode,
  isTypeReferenceNode,
  isUnionTypeNode,
  isVariableDeclaration,
  type Node,
  type SourceFile,
  type TypeNode,
} from 'typescript/ast';
import type {createFileSystemWithLib} from 'typescript/fs';
import {
  API,
  type Checker,
  type Project,
  type Snapshot,
  type Symbol as TsSymbol,
  SymbolFlags,
  type Type,
  TypeFlags,
} from 'typescript/sync';
import {logWarn} from './logger.js';

export type RequestFileSystem = ReturnType<typeof createFileSystemWithLib>;

export interface AnalyzerOptions {
  /** Directory containing `tsconfig.json` and the `pastoria/` directory. */
  projectDir: string;
  /** Path to the tsconfig. Defaults to `<projectDir>/tsconfig.json`. */
  tsconfigPath?: string;
  /** Virtual filesystem for the TypeScript server. Used by tests. */
  fileSystem?: RequestFileSystem;
}

export interface FileChanges {
  changed?: string[];
  created?: string[];
  deleted?: string[];
}

/** Everything the generator needs to know about one module under `pastoria/`. */
export interface ModuleInfo {
  fileName: string;
  /** Names of all exports, including types. */
  exports: Set<string>;
  /** Source text of the initializer of `export const schema = ...`. */
  schemaText: string | undefined;
  /** Source text of the initializer of `export const getPreloadProps = ...`. */
  getPreloadPropsText: string | undefined;
  /** Query ref name → Relay query type name, from `export type Queries`. */
  queries: Map<string, string>;
  /** Entrypoint ref name → resource ID, from `export type EntryPoints`. */
  entryPoints: Map<string, string>;
}

/**
 * Function that renders a Zod schema for a query variable. Takes the path of the
 * file the schema will be written into, for computing relative import paths.
 */
export type ZodSchemaRenderer = (targetFile: string) => string;

export class PastoriaAnalyzer {
  readonly projectDir: string;
  private readonly tsconfigPath: string;
  private readonly fileSystem: RequestFileSystem | undefined;
  private readonly api: API;
  private snapshot: Snapshot | undefined;
  private pendingChanges: Required<FileChanges> = {
    changed: [],
    created: [],
    deleted: [],
  };

  private moduleCache = new Map<string, ModuleInfo>();
  private queryVariablesCache = new Map<
    string,
    Map<string, ZodSchemaRenderer>
  >();

  constructor(options: AnalyzerOptions) {
    this.projectDir = options.projectDir;
    this.tsconfigPath =
      options.tsconfigPath ?? path.join(options.projectDir, 'tsconfig.json');
    this.fileSystem = options.fileSystem;
    this.api = new API({cwd: options.projectDir});
  }

  /**
   * Records files that changed on disk. They are picked up the next time the
   * program is accessed.
   */
  notifyChanges(changes: FileChanges) {
    this.pendingChanges.changed.push(...(changes.changed ?? []));
    this.pendingChanges.created.push(...(changes.created ?? []));
    this.pendingChanges.deleted.push(...(changes.deleted ?? []));
    this.invalidate();
  }

  /** Drops cached analysis so the next access sees the latest program. */
  private invalidate() {
    this.moduleCache.clear();
    this.queryVariablesCache.clear();
    this.needsRefresh = true;
  }

  private needsRefresh = true;

  private get project(): Project {
    if (this.needsRefresh || this.snapshot == null) {
      // Closing and re-opening the project in the same update forces tsgo to
      // rebuild the program from the notified changes. It is incremental and
      // typically takes a few milliseconds.
      const params = {
        openProjects: [this.tsconfigPath],
        closeProjects: this.snapshot ? [this.tsconfigPath] : undefined,
        fileNotifications: this.snapshot ? this.pendingChanges : undefined,
        fileSystem: this.fileSystem,
      };

      const previous = this.snapshot;
      this.snapshot = previous
        ? previous.update(params)
        : this.api.createSnapshot(params);
      previous?.dispose();

      this.pendingChanges = {changed: [], created: [], deleted: []};
      this.needsRefresh = false;
    }

    const project = this.snapshot.getConfiguredProject(this.tsconfigPath);
    if (project == null) {
      throw new Error(`Could not load TypeScript project ${this.tsconfigPath}`);
    }

    return project;
  }

  private get checker(): Checker {
    return this.project.checker;
  }

  /** All source files in the program located under `<projectDir>/pastoria/`. */
  getPastoriaSourceFiles(): string[] {
    const pastoriaDir = path.join(this.projectDir, 'pastoria') + path.sep;
    return this.project.program
      .getSourceFileNames()
      .filter((f) => f.startsWith(pastoriaDir))
      .sort(compareByDepthThenPath);
  }

  /** Returns all export names and the bits of syntax the generator copies. */
  getModuleInfo(fileName: string): ModuleInfo {
    let info = this.moduleCache.get(fileName);
    if (info == null) {
      info = this.analyzeModule(fileName);
      this.moduleCache.set(fileName, info);
    }

    return info;
  }

  private analyzeModule(fileName: string): ModuleInfo {
    const sourceFile = this.project.program.getSourceFile(fileName);
    if (sourceFile == null) {
      throw new Error(`Could not find source file ${fileName}`);
    }

    const exports = this.getExportSymbols(sourceFile);
    const info: ModuleInfo = {
      fileName,
      exports: new Set(exports.keys()),
      schemaText: undefined,
      getPreloadPropsText: undefined,
      queries: new Map(),
      entryPoints: new Map(),
    };

    const schema = exports.get('schema');
    if (schema) {
      info.schemaText = this.getVariableInitializerText(schema);
    }

    const getPreloadProps = exports.get('getPreloadProps');
    if (getPreloadProps) {
      info.getPreloadPropsText =
        this.getVariableInitializerText(getPreloadProps);
      if (info.getPreloadPropsText == null) {
        throw new Error(
          `Found exported getPreloadProps in ${fileName} but it wasn't a variable initialized with a function expression.`,
        );
      }
    }

    const queries = exports.get('Queries');
    if (queries) {
      info.queries = this.getQueries(queries);
    }

    const entryPoints = exports.get('EntryPoints');
    if (entryPoints) {
      info.entryPoints = this.getEntryPoints(entryPoints);
    }

    return info;
  }

  private getExportSymbols(sourceFile: SourceFile): Map<string, TsSymbol> {
    const checker = this.checker;
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    const exports = new Map<string, TsSymbol>();
    if (moduleSymbol == null) return exports;

    for (let symbol of checker.getExportsOfModule(moduleSymbol)) {
      const name = symbol.name;
      // Follow re-exports (`export {x} from './y'`) to the original declaration.
      if (symbol.flags & SymbolFlags.Alias) {
        symbol = checker.getAliasedSymbol(symbol);
      }

      exports.set(name, symbol);
    }

    return exports;
  }

  private getDeclaration(symbol: TsSymbol): Node | undefined {
    return symbol.declarations[0]?.resolve(this.project);
  }

  private getVariableInitializerText(symbol: TsSymbol): string | undefined {
    const decl = this.getDeclaration(symbol);
    if (decl == null || !isVariableDeclaration(decl)) return undefined;
    return decl.initializer?.getText();
  }

  /**
   * Reads `export type Queries = {ref: SomeQuery}` into `{ref -> 'SomeQuery'}`
   * using the alias name of each property's type.
   */
  private getQueries(queriesSymbol: TsSymbol): Map<string, string> {
    const checker = this.checker;
    const queries = new Map<string, string>();
    const queriesType = checker.getDeclaredTypeOfSymbol(queriesSymbol);

    for (const prop of checker.getPropertiesOfType(queriesType)) {
      const propType = checker.getTypeOfSymbol(prop);
      const queryName = propType?.getAliasSymbol()?.name;
      if (queryName) {
        queries.set(prop.name, queryName);
      }
    }

    return queries;
  }

  /**
   * Reads `export type EntryPoints = {ref: EntryPoint<ModuleType<'/route#name'>, ...>}`
   * into `{ref -> '/route#name'}`.
   *
   * This is read from syntax rather than resolved types: `ModuleType` is defined
   * in the generated `js_resource.ts`, so resolving it would make the result
   * depend on the previous run's output.
   */
  private getEntryPoints(entryPointsSymbol: TsSymbol): Map<string, string> {
    const entryPoints = new Map<string, string>();
    const decl = this.getDeclaration(entryPointsSymbol);

    let members: readonly Node[] | undefined;
    if (decl && isTypeAliasDeclaration(decl) && isTypeLiteralNode(decl.type)) {
      members = decl.type.members;
    } else if (decl && isInterfaceDeclaration(decl)) {
      members = decl.members;
    }

    if (members == null) {
      logWarn(
        `Expected EntryPoints to be an object type: ${decl?.getText() ?? 'unknown'}`,
      );
      return entryPoints;
    }

    for (const member of members) {
      const {name, type} = member as Node & {name?: Node; type?: TypeNode};
      const propName =
        name && (isIdentifier(name) || isStringLiteral(name))
          ? name.text
          : undefined;
      const resourceName = type && resourceNameOfEntryPointType(type);

      if (propName == null || resourceName == null) {
        logWarn(
          `Found invalid type exported in EntryPoints: ${member.getText()}`,
        );
        continue;
      }

      entryPoints.set(propName, resourceName);
    }

    return entryPoints;
  }

  /**
   * Returns the variables of a Relay query as `{name -> zod schema renderer}`.
   * The query's `$variables` type is located next to the query type's own
   * declaration, which Relay generates as `<Query>.graphql.ts`.
   */
  getQueryVariables(
    moduleFileName: string,
    queryName: string,
  ): Map<string, ZodSchemaRenderer> {
    let vars = this.queryVariablesCache.get(queryName);
    if (vars == null) {
      vars = this.collectQueryVariables(moduleFileName, queryName);
      this.queryVariablesCache.set(queryName, vars);
    }

    return vars;
  }

  private collectQueryVariables(
    moduleFileName: string,
    queryName: string,
  ): Map<string, ZodSchemaRenderer> {
    const vars = new Map<string, ZodSchemaRenderer>();
    const checker = this.checker;
    const queryFile = this.findQueryFile(moduleFileName, queryName);
    if (queryFile == null) return vars;

    const variablesSymbol = this.getExportSymbols(queryFile).get(
      `${queryName}$variables`,
    );
    if (variablesSymbol == null) return vars;

    const variablesType = checker.getDeclaredTypeOfSymbol(variablesSymbol);
    for (const prop of checker.getPropertiesOfType(variablesType)) {
      const propType = checker.getTypeOfSymbol(prop);
      if (propType == null) continue;
      vars.set(prop.name, this.zodSchemaOfType(propType));
    }

    return vars;
  }

  private findQueryFile(
    moduleFileName: string,
    queryName: string,
  ): SourceFile | undefined {
    const {program} = this.project;

    // Prefer resolving the query type through the module that references it.
    const sourceFile = program.getSourceFile(moduleFileName);
    const queriesSymbol =
      sourceFile && this.getExportSymbols(sourceFile).get('Queries');
    if (queriesSymbol) {
      const checker = this.checker;
      const queriesType = checker.getDeclaredTypeOfSymbol(queriesSymbol);
      for (const prop of checker.getPropertiesOfType(queriesType)) {
        const alias = checker.getTypeOfSymbol(prop)?.getAliasSymbol();
        if (alias?.name !== queryName) continue;
        const decl = this.getDeclaration(alias);
        if (decl) return decl.getSourceFile();
      }
    }

    // Fall back to Relay's conventional output location.
    return program.getSourceFile(
      path.join(
        this.projectDir,
        '__generated__/queries',
        `${queryName}.graphql.ts`,
      ),
    );
  }

  /**
   * Creates a renderer for the Zod schema of a type. The type is fully analyzed
   * up front; rendering only computes import paths relative to the target file.
   */
  private zodSchemaOfType(t: Type): ZodSchemaRenderer {
    const checker = this.checker;
    const aliasSymbol = t.getAliasSymbol();

    if (aliasSymbol) {
      const declFile =
        this.getDeclaration(aliasSymbol)?.getSourceFile().fileName;
      if (declFile == null) {
        logWarn('Could not handle type:', checker.typeToString(t));
        return () => `z.any()`;
      }

      const aliasName = aliasSymbol.name;
      return (targetFile) =>
        `z.transform((s: string) => s as import('${moduleSpecifier(targetFile, declFile)}').${aliasName})`;
    } else if (t.flags & TypeFlags.String) {
      return () => `z.pipe(z.string(), z.transform(decodeURIComponent))`;
    } else if (t.flags & TypeFlags.Number) {
      return () => `z.coerce.number<number>()`;
    } else if (t.flags & TypeFlags.Null) {
      return () =>
        `z.preprocess(s => s == null ? undefined : s, z.undefined())`;
    } else if (t.isUnionType()) {
      const types = t.getTypes() ?? [];
      const isNullish = (s: Type) =>
        (s.flags & TypeFlags.Null) !== 0 ||
        (s.flags & TypeFlags.Undefined) !== 0;

      const hasNullish = types.some(isNullish);
      const hasNonNullish = types.some((s) => !isNullish(s));

      if (hasNullish && hasNonNullish) {
        const inner = this.zodSchemaOfType(checker.getNonNullableType(t) ?? t);
        return (targetFile) =>
          `z.pipe(z.nullish(${inner(targetFile)}), z.transform(s => s == null ? undefined : s))`;
      } else {
        const members = types.map((it) => this.zodSchemaOfType(it));
        return (targetFile) =>
          `z.union([${members.map((m) => m(targetFile)).join(', ')}])`;
      }
    } else if (checker.isArrayLikeType(t)) {
      const typeArg = t.isTypeReference()
        ? checker.getTypeArguments(t)[0]
        : undefined;

      const element =
        typeArg == null ? () => `z.any()` : this.zodSchemaOfType(typeArg);
      return (targetFile) => `z.array(${element(targetFile)})`;
    } else {
      logWarn('Could not handle type:', checker.typeToString(t));
      return () => `z.any()`;
    }
  }

  close() {
    this.snapshot?.dispose();
    this.snapshot = undefined;
    this.api.close();
  }
}

/**
 * Extracts `'/route#name'` from `EntryPoint<ModuleType<'/route#name'>, ...>`,
 * allowing the entrypoint to be optional (`... | undefined`).
 */
function resourceNameOfEntryPointType(type: TypeNode): string | undefined {
  if (isUnionTypeNode(type)) {
    for (const t of type.types) {
      const name = resourceNameOfEntryPointType(t);
      if (name != null) return name;
    }

    return undefined;
  }

  if (
    !isTypeReferenceNode(type) ||
    entityName(type.typeName) !== 'EntryPoint'
  ) {
    return undefined;
  }

  const moduleType = type.typeArguments?.[0];
  if (
    moduleType == null ||
    !isTypeReferenceNode(moduleType) ||
    entityName(moduleType.typeName) !== 'ModuleType'
  ) {
    return undefined;
  }

  const literalType = moduleType.typeArguments?.[0];
  if (
    literalType == null ||
    !isLiteralTypeNode(literalType) ||
    !isStringLiteral(literalType.literal)
  ) {
    return undefined;
  }

  return literalType.literal.text;
}

/** Returns the rightmost identifier of `Foo` or `ns.Foo`. */
function entityName(name: Node): string | undefined {
  if (isIdentifier(name)) return name.text;
  if (isQualifiedName(name)) return name.right.text;
  return undefined;
}

/** Orders shallower files first, then alphabetically, for stable output. */
function compareByDepthThenPath(a: string, b: string): number {
  const depth = (f: string) => f.split(path.sep).length;
  return depth(a) - depth(b) || (a < b ? -1 : a > b ? 1 : 0);
}

/**
 * Returns a relative module specifier from `fromFile` to `toFile`, without
 * TypeScript extensions, e.g. `../../pastoria/hello/[name]/page`.
 */
export function moduleSpecifier(fromFile: string, toFile: string): string {
  let rel = path
    .relative(path.dirname(fromFile), toFile)
    .split(path.sep)
    .join('/')
    .replace(/(\.d)?\.[cm]?tsx?$/, '');

  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}
