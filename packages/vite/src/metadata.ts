import * as path from 'node:path';
import {Project, SourceFile, Symbol, ts} from 'ts-morph';
import {logInfo} from './logger.js';

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
  readonly serverRoutes: ServerRoute[];

  /**
   * page.tsx files used to generate React routes.
   */
  readonly entryPointRoutes: ServerRoute[];

  /**
   * Entry points defined in the #pastoria directory, not necessarily directly routable. Contains source files also
   * in `entryPointRoutes`.
   */
  readonly resourceSourceFiles: SourceFile[];

  constructor(project: Project, projectDir: string) {
    logInfo('Collecting metadata...');

    const serverRoutes: ServerRoute[] = [];
    const entryPointRoutes: ServerRoute[] = [];
    const resourceSourceFiles: SourceFile[] = [];
    const pastoriaDir = project.getDirectory('pastoria');

    // Single pass over all source files to classify them
    for (const sourceFile of project.getSourceFiles('pastoria/**')) {
      const baseName = sourceFile.getBaseName();
      const projectFilePath = path.relative(
        projectDir,
        sourceFile.getFilePath(),
      );

      // Server routes: route.ts files
      if (baseName === 'route.ts') {
        const defaultExport = sourceFile.getDefaultExportSymbol();
        if (defaultExport != null) {
          const routeName = pastoriaDir?.getRelativePathTo(
            sourceFile.getDirectory(),
          );
          if (routeName) {
            serverRoutes.push({
              routeName: '/' + routeName,
              routePath: '/' + routeName.replace(/\[(\w+)\]/g, ':$1'),
              sourceFile,
              symbol: defaultExport,
            });
          }
        }
        continue;
      }

      // Skip reserved framework config files and typing files
      if (PastoriaMetadata.RESERVED_FILES.has(projectFilePath)) continue;
      if (projectFilePath.endsWith('.d.ts')) continue;
      if (projectFilePath.endsWith('route.tsx')) continue;

      // Resource files (all remaining .tsx files)
      resourceSourceFiles.push(sourceFile);

      // Entry point routes: page.tsx files with a default export
      if (baseName === 'page.tsx') {
        const defaultExport = sourceFile.getDefaultExportSymbol();
        if (defaultExport != null) {
          let routeName = pastoriaDir?.getRelativePathTo(
            sourceFile.getDirectory(),
          );
          if (routeName === '../pastoria') {
            routeName = '';
          } else if (!routeName) {
            continue;
          }
          entryPointRoutes.push({
            routeName: '/' + routeName,
            routePath: '/' + routeName.replace(/\[(\w+)\]/g, ':$1'),
            sourceFile,
            symbol: defaultExport,
          });
        }
      }
    }

    this.serverRoutes = serverRoutes;
    this.entryPointRoutes = entryPointRoutes;
    this.resourceSourceFiles = resourceSourceFiles;
    logInfo('Metadata complete');
  }
}
