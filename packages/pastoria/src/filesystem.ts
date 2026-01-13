/**
 * @fileoverview Filesystem Router Scanner
 *
 * This module scans the `pastoria/` directory to discover routes, pages, and API handlers
 * using a filesystem-based routing convention similar to Next.js App Router.
 *
 * ## File Conventions
 *
 * - `page.tsx` - Defines a page component for a route
 * - `*.page.tsx` - Defines a nested entry point (accessible via props.entryPoints)
 * - `entrypoint.ts` - Manually defined entry point with custom getPreloadProps
 * - `app.tsx` - Root layout component (wraps the entire app)
 * - `route.ts` - API route handler (exports express.Router)
 *
 * ## Route Path Extraction
 *
 * Directory structure maps to URL routes:
 * - `pastoria/page.tsx` → `/`
 * - `pastoria/about/page.tsx` → `/about`
 * - `pastoria/post/[slug]/page.tsx` → `/post/[slug]`
 *
 * Parameters are defined using square brackets: `[paramName]`
 */

import * as path from 'node:path';
import {Project, SourceFile, SyntaxKind} from 'ts-morph';
import {logInfo, logWarn} from './logger.js';
import pc from 'picocolors';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents a page discovered in the filesystem.
 * Pages are defined by `page.tsx` files and map to URL routes.
 */
export interface FilesystemPage {
  /** The URL route path (e.g., "/", "/about", "/post/[slug]") */
  routePath: string;

  /** The filesystem path relative to project root (e.g., "pastoria/about/page.tsx") */
  filePath: string;

  /** Route parameters extracted from the path (e.g., ["slug"]) */
  params: string[];

  /**
   * Queries exported from the page file.
   * Maps query reference name to the Relay query type name.
   * e.g., { "blogPosts": "page_BlogPostsQuery" }
   */
  queries: Map<string, string>;

  /**
   * Nested entry points discovered in the same directory.
   * These are files matching `*.page.tsx` (not `page.tsx`).
   * Maps entry point name to its page definition.
   */
  nestedEntryPoints: Map<string, FilesystemPage>;
}

/**
 * Represents a manually defined entry point.
 * These are defined by `entrypoint.ts` files and offer more flexibility.
 */
export interface FilesystemEntryPoint {
  /** The URL route path */
  routePath: string;

  /** The filesystem path */
  filePath: string;

  /** Route parameters */
  params: string[];
}

/**
 * Represents an API route handler.
 * These are defined by `route.ts` files and export express.Router instances.
 */
export interface FilesystemApiRoute {
  /** The URL route path (e.g., "/api/posts") */
  routePath: string;

  /** The filesystem path */
  filePath: string;

  /** Route parameters */
  params: string[];
}

/**
 * Complete metadata about the filesystem routing structure.
 */
export interface FilesystemMetadata {
  /** All discovered pages, keyed by route path */
  pages: Map<string, FilesystemPage>;

  /** Manually defined entry points, keyed by route path */
  entryPoints: Map<string, FilesystemEntryPoint>;

  /** API route handlers, keyed by route path */
  apiRoutes: Map<string, FilesystemApiRoute>;

  /** Path to app.tsx if it exists, null otherwise */
  appRoot: string | null;
}

// ============================================================================
// Path Parsing Utilities
// ============================================================================

/**
 * Extracts the route path and parameters from a filesystem path.
 * Route paths preserve the `[param]` syntax from the filesystem.
 *
 * @example
 * parseRoutePath("pastoria/post/[slug]/page.tsx")
 * // Returns: { routePath: "/post/[slug]", params: ["slug"] }
 *
 * @example
 * parseRoutePath("pastoria/about/page.tsx")
 * // Returns: { routePath: "/about", params: [] }
 */
export function parseRoutePath(filePath: string): {
  routePath: string;
  params: string[];
} {
  // Remove the pastoria/ prefix and the filename
  const relativePath = filePath
    .replace(/^pastoria\//, '')
    .replace(/^(page|entrypoint|route)\.(tsx?|ts)$/, '') // Handle root files
    .replace(/\/(page|entrypoint|route)\.(tsx?|ts)$/, '') // Handle nested files
    .replace(/\.page\.(tsx?|ts)$/, ''); // Handle nested entry points

  // Handle root route
  if (relativePath === '') {
    return {routePath: '/', params: []};
  }

  const params: string[] = [];
  const segments = relativePath.split('/').filter(Boolean);

  // Collect param names from [param] segments (but keep the brackets in the path)
  for (const segment of segments) {
    const paramMatch = segment.match(/^\[(.+)\]$/);
    if (paramMatch && paramMatch[1]) {
      params.push(paramMatch[1]);
    }
  }

  const routePath = '/' + segments.join('/');
  return {routePath, params};
}

/**
 * Converts a route path from [param] format to :param format for the router.
 *
 * @example
 * toRouterPath("/post/[slug]")
 * // Returns: "/post/:slug"
 */
export function toRouterPath(routePath: string): string {
  return routePath.replace(/\[([^\]]+)\]/g, ':$1');
}

/**
 * Extracts the entry point name from a nested entry point file.
 *
 * @example
 * getNestedEntryPointName("pastoria/banner.page.tsx")
 * // Returns: "banner"
 *
 * @example
 * getNestedEntryPointName("pastoria/sidebar.page.tsx")
 * // Returns: "sidebar"
 */
export function getNestedEntryPointName(filePath: string): string | null {
  const match = filePath.match(/\/([^/]+)\.page\.tsx?$/);
  return match?.[1] ?? null;
}

// ============================================================================
// Query Extraction
// ============================================================================

/**
 * Extracts the `queries` export from a page file.
 *
 * Looks for patterns like:
 * ```typescript
 * export const queries = {
 *   blogPosts: page_BlogPostsQuery,
 *   otherQuery: page_OtherQuery
 * };
 * ```
 *
 * @returns Map of query reference name to query type name
 */
export function extractQueriesFromPage(
  sourceFile: SourceFile,
): Map<string, string> {
  const queries = new Map<string, string>();

  // Find the 'queries' export
  const queriesDecl = sourceFile.getVariableDeclaration('queries');
  if (!queriesDecl) {
    return queries;
  }

  // Check if it's exported
  const varStatement = queriesDecl.getParent()?.getParent();
  if (!varStatement?.asKind(SyntaxKind.VariableStatement)?.isExported()) {
    return queries;
  }

  // Get the initializer (the object literal)
  const initializer = queriesDecl.getInitializer();
  if (!initializer?.isKind(SyntaxKind.ObjectLiteralExpression)) {
    logWarn(
      `Expected 'queries' to be an object literal in ${sourceFile.getFilePath()}`,
    );
    return queries;
  }

  // Extract each property
  const objectLiteral = initializer.asKindOrThrow(
    SyntaxKind.ObjectLiteralExpression,
  );

  for (const prop of objectLiteral.getProperties()) {
    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const propAssign = prop.asKindOrThrow(SyntaxKind.PropertyAssignment);
      const keyName = propAssign.getName();
      const valueNode = propAssign.getInitializer();

      if (valueNode?.isKind(SyntaxKind.Identifier)) {
        // The value is a reference to a query type (e.g., page_BlogPostsQuery)
        const queryTypeName = valueNode.getText();
        queries.set(keyName, queryTypeName);
      } else if (valueNode?.isKind(SyntaxKind.PropertyAccessExpression)) {
        // Handle cases like SomeModule.QueryType
        const queryTypeName = valueNode.getText();
        queries.set(keyName, queryTypeName);
      }
    } else if (prop.isKind(SyntaxKind.ShorthandPropertyAssignment)) {
      // Handle shorthand like { blogPosts } where the key and value are the same
      const shorthand = prop.asKindOrThrow(
        SyntaxKind.ShorthandPropertyAssignment,
      );
      const name = shorthand.getName();
      queries.set(name, name);
    }
  }

  return queries;
}

/**
 * Gets the default export name from a source file.
 * Used to find the component name for pages.
 */
export function getDefaultExportName(sourceFile: SourceFile): string | null {
  // Check for: export default function Name() {}
  const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
  if (defaultExportSymbol) {
    const declarations = defaultExportSymbol.getDeclarations();
    for (const decl of declarations) {
      // Function declaration
      if (decl.isKind(SyntaxKind.FunctionDeclaration)) {
        return decl.getName() ?? null;
      }
      // Export assignment: export default SomeComponent
      if (decl.isKind(SyntaxKind.ExportAssignment)) {
        const expr = decl.getExpression();
        if (expr.isKind(SyntaxKind.Identifier)) {
          return expr.getText();
        }
      }
    }
  }

  return null;
}

// ============================================================================
// Filesystem Scanner (using ts-morph Project)
// ============================================================================

/**
 * Scans the `pastoria/` directory and discovers all routing metadata.
 *
 * Uses the ts-morph Project API to discover files instead of Node fs APIs.
 * This ensures we're working with the same file set that TypeScript knows about.
 */
export function scanFilesystemRoutes(project: Project): FilesystemMetadata {
  // Add all files in pastoria/ directory to the project
  project.addSourceFilesAtPaths('pastoria/**/*.{ts,tsx}');

  const metadata: FilesystemMetadata = {
    pages: new Map(),
    entryPoints: new Map(),
    apiRoutes: new Map(),
    appRoot: null,
  };

  // Categorize files by type
  const pageFiles: SourceFile[] = [];
  const nestedEntryPointFiles: SourceFile[] = [];
  const entryPointFiles: SourceFile[] = [];
  const routeFiles: SourceFile[] = [];

  // Get all source files and filter to pastoria/ directory
  for (const sourceFile of project.getSourceFiles()) {
    const absolutePath = sourceFile.getFilePath();
    const relativePath = path.relative(process.cwd(), absolutePath);

    // Only process files in the pastoria/ directory
    if (!relativePath.startsWith('pastoria/')) {
      continue;
    }

    const fileName = path.basename(relativePath);

    // Check for app.tsx (root layout)
    if (relativePath === 'pastoria/app.tsx') {
      metadata.appRoot = relativePath;
      logInfo('Found app root at', pc.yellow(relativePath));
      continue;
    }

    // Check for page.tsx files (main routes)
    if (fileName === 'page.tsx' || fileName === 'page.ts') {
      pageFiles.push(sourceFile);
      continue;
    }

    // Check for *.page.tsx files (nested entry points)
    if (/\.page\.tsx?$/.test(fileName)) {
      nestedEntryPointFiles.push(sourceFile);
      continue;
    }

    // Check for entrypoint.ts files (manual entry points)
    if (fileName === 'entrypoint.ts' || fileName === 'entrypoint.tsx') {
      entryPointFiles.push(sourceFile);
      continue;
    }

    // Check for route.ts files (API routes)
    if (fileName === 'route.ts' || fileName === 'route.tsx') {
      routeFiles.push(sourceFile);
      continue;
    }
  }

  // Process page files and extract metadata
  for (const sourceFile of pageFiles) {
    const absolutePath = sourceFile.getFilePath();
    const filePath = path.relative(process.cwd(), absolutePath);
    const {routePath, params} = parseRoutePath(filePath);

    const queries = extractQueriesFromPage(sourceFile);

    const page: FilesystemPage = {
      routePath,
      filePath,
      params,
      queries,
      nestedEntryPoints: new Map(),
    };

    metadata.pages.set(routePath, page);

    logInfo(
      'Found page',
      pc.cyan(routePath),
      'at',
      pc.yellow(filePath),
      queries.size > 0 ? `with ${queries.size} queries` : '',
    );
  }

  // Associate nested entry points with their parent pages
  for (const sourceFile of nestedEntryPointFiles) {
    const absolutePath = sourceFile.getFilePath();
    const filePath = path.relative(process.cwd(), absolutePath);
    const entryPointName = getNestedEntryPointName(filePath);
    if (!entryPointName) continue;

    // Find the parent directory's route
    const parentDir = path.dirname(filePath);
    const parentPagePath = path.join(parentDir, 'page.tsx');

    // Parse route from the parent directory
    const {routePath: parentRoutePath} = parseRoutePath(parentPagePath);
    const parentPage = metadata.pages.get(parentRoutePath);

    if (!parentPage) {
      logWarn(
        `Nested entry point ${filePath} has no parent page.tsx in ${parentDir}`,
      );
      continue;
    }

    const queries = extractQueriesFromPage(sourceFile);
    const {params} = parseRoutePath(filePath);

    const nestedPage: FilesystemPage = {
      routePath: `${parentRoutePath}#${entryPointName}`, // Internal identifier
      filePath,
      params,
      queries,
      nestedEntryPoints: new Map(), // Nested entry points can't have their own nested entry points
    };

    parentPage.nestedEntryPoints.set(entryPointName, nestedPage);

    logInfo(
      'Found nested entry point',
      pc.cyan(entryPointName),
      'for route',
      pc.cyan(parentRoutePath),
    );
  }

  // Process manual entry point files
  for (const sourceFile of entryPointFiles) {
    const absolutePath = sourceFile.getFilePath();
    const filePath = path.relative(process.cwd(), absolutePath);
    const {routePath, params} = parseRoutePath(filePath);

    // Manual entry points take precedence over page.tsx
    if (metadata.pages.has(routePath)) {
      logWarn(
        `Manual entrypoint.ts at ${filePath} overrides page.tsx for route ${routePath}`,
      );
      metadata.pages.delete(routePath);
    }

    const entryPoint: FilesystemEntryPoint = {
      routePath,
      filePath,
      params,
    };

    metadata.entryPoints.set(routePath, entryPoint);

    logInfo(
      'Found manual entry point',
      pc.cyan(routePath),
      'at',
      pc.yellow(filePath),
    );
  }

  // Process API route files
  for (const sourceFile of routeFiles) {
    const absolutePath = sourceFile.getFilePath();
    const filePath = path.relative(process.cwd(), absolutePath);
    const {routePath, params} = parseRoutePath(filePath);

    const apiRoute: FilesystemApiRoute = {
      routePath,
      filePath,
      params,
    };

    metadata.apiRoutes.set(routePath, apiRoute);

    logInfo(
      'Found API route',
      pc.cyan(routePath),
      'at',
      pc.yellow(filePath),
    );
  }

  return metadata;
}

/**
 * Checks if a pastoria/ directory exists with routing files.
 */
export function hasFilesystemRoutes(project: Project): boolean {
  // Try to find any source files in the pastoria/ directory
  const pastoriaFiles = project.getSourceFiles('pastoria/**/*.{ts,tsx}');
  return pastoriaFiles.length > 0;
}
