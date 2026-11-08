import * as path from 'node:path';
import type {PastoriaAnalyzer} from './analyzer.js';
import {logInfo} from './logger.js';

/**
 * A route defined by a file under pastoria/, either a page.tsx (React route) or
 * a route.ts (Express API route).
 */
export interface PastoriaRoute {
  /** Absolute path of the page.tsx or route.ts file. */
  fileName: string;
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

export class PastoriaMetadata {
  /**
   * Files reserved by Pastoria that cannot be entry points.
   */
  private static RESERVED_FILES = new Set([
    'pastoria/app.tsx',
    'pastoria/app.ts',
    'pastoria/environment.ts',
  ]);

  /**
   * route.ts files used to generate server route handlers.
   */
  readonly serverRoutes: PastoriaRoute[];

  /**
   * page.tsx files used to generate React routes.
   */
  readonly entryPointRoutes: PastoriaRoute[];

  /**
   * Entry points defined in the #pastoria directory, not necessarily directly
   * routable. Contains files also in `entryPointRoutes`.
   */
  readonly resourceFiles: string[];

  private readonly pastoriaDir: string;

  constructor(
    analyzer: PastoriaAnalyzer,
    private readonly projectDir: string,
  ) {
    this.pastoriaDir = path.join(projectDir, 'pastoria');
    const sourceFiles = analyzer.getPastoriaSourceFiles();
    if (sourceFiles.length === 0) {
      throw new Error('Could not locate pastoria source directory!');
    }

    const hasDefaultExport = (fileName: string) =>
      analyzer.getModuleInfo(fileName).exports.has('default');

    logInfo('Collecting server routes...');
    this.serverRoutes = sourceFiles
      .filter((f) => path.basename(f) === 'route.ts' && hasDefaultExport(f))
      .map((f) => this.routeOfFile(f));

    logInfo('Collecting entry points...');
    this.entryPointRoutes = sourceFiles
      .filter((f) => path.basename(f) === 'page.tsx' && hasDefaultExport(f))
      .map((f) => this.routeOfFile(f));

    logInfo('Collecting resources...');
    this.resourceFiles = sourceFiles.filter((f) => this.isResourceFile(f));
    logInfo('Metadata complete');
  }

  private routeOfFile(fileName: string): PastoriaRoute {
    // The route name is the path of the containing directory relative to
    // pastoria/, with pastoria/page.tsx mapping to `/`.
    const routeName =
      '/' +
      path
        .relative(this.pastoriaDir, path.dirname(fileName))
        .split(path.sep)
        .join('/');

    return {
      fileName,
      routeName,
      routePath: routeName.replace(/\[(\w+)\]/g, ':$1'),
    };
  }

  private isResourceFile(fileName: string) {
    const projectFilePath = path
      .relative(this.projectDir, fileName)
      .split(path.sep)
      .join('/');

    // Exclude files reserved for configuring the framework.
    if (PastoriaMetadata.RESERVED_FILES.has(projectFilePath)) {
      return false;
    }

    // Don't generate for typing files.
    if (projectFilePath.endsWith('.d.ts')) {
      return false;
    }

    // Exclude route.ts files used to generate server route handlers.
    if (
      projectFilePath.endsWith('route.ts') ||
      projectFilePath.endsWith('route.tsx')
    ) {
      return false;
    }

    return true;
  }
}
