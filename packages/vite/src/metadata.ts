import * as path from 'node:path';
import {Directory, Project, SourceFile, Symbol, ts} from 'ts-morph';
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

  private readonly pastoriaDirectory: Directory;

  /** Source files in the pastoria directory. */
  private readonly projectSourceFiles: SourceFile[];

  constructor(project: Project, projectDir: string) {
    const pastoriaDirectory = project.getDirectory('pastoria');
    if (!pastoriaDirectory) {
      throw new Error('Could not locate pastoria source directory!');
    }

    this.pastoriaDirectory = pastoriaDirectory;
    this.projectSourceFiles = project.getSourceFiles('pastoria/**');
    logInfo('Collecting server routes...');
    this.serverRoutes = this.collectServerRoutes();
    logInfo('Collecting entry points...');
    this.entryPointRoutes = this.collectEntryPointRoutes();
    logInfo('Collecting resources...');
    this.resourceSourceFiles = this.collectResourceFiles(projectDir);
    logInfo('Metadata complete');
  }

  private collectServerRoutes(): ServerRoute[] {
    const serverRoutes: ServerRoute[] = [];

    const visitSourceFile = (sourceFile: SourceFile) => {
      if (sourceFile.getBaseName() !== 'route.ts') return;

      const defaultExport = sourceFile.getDefaultExportSymbol();
      if (defaultExport == null) return;

      const routeName = this.pastoriaDirectory?.getRelativePathTo(
        sourceFile.getDirectory(),
      );

      if (!routeName) return;

      serverRoutes.push({
        routeName: '/' + routeName,
        routePath: '/' + routeName.replace(/\[(\w+)\]/g, ':$1'),
        sourceFile,
        symbol: defaultExport,
      });
    };

    this.projectSourceFiles.forEach(visitSourceFile);
    return serverRoutes;
  }

  private collectEntryPointRoutes(): ServerRoute[] {
    const routes: ServerRoute[] = [];

    const visitSourceFile = (sourceFile: SourceFile) => {
      if (sourceFile.getBaseName() !== 'page.tsx') return;

      const defaultExport = sourceFile.getDefaultExportSymbol();
      if (defaultExport == null) return;

      // The route name is the relative path to the directory containing page.tsx
      let routeName = this.pastoriaDirectory?.getRelativePathTo(
        sourceFile.getDirectory(),
      );

      // Handle the special case of `#pastoria/page.tsx`
      if (routeName === '../pastoria') {
        routeName = '';
      } else if (!routeName) {
        return;
      }

      routes.push({
        routeName: '/' + routeName,
        routePath: '/' + routeName.replace(/\[(\w+)\]/g, ':$1'),
        sourceFile,
        symbol: defaultExport,
      });
    };

    this.projectSourceFiles.forEach(visitSourceFile);
    return routes;
  }

  private collectResourceFiles(projectDir: string) {
    return this.projectSourceFiles.filter((sf) => {
      const projectFilePath = path.relative(projectDir, sf.getFilePath());

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
    });
  }
}
