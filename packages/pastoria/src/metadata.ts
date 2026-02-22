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
    this.serverRoutes = this.collectServerRoutes(project);
    this.entryPointRoutes = this.collectEntryPointRoutes(project);
    this.resourceSourceFiles = this.collectResourceFiles(project, projectDir);
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

      // The route name is the relative path to the directory containing page.tsx
      let routeName = project
        .getDirectory('pastoria')
        ?.getRelativePathTo(sourceFile.getDirectory());

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
    }

    project.getSourceFiles('pastoria/**').forEach(visitSourceFile);
    return routes;
  }

  private collectResourceFiles(project: Project, projectDir: string) {
    return project.getSourceFiles('pastoria/**').filter((sf) => {
      const projectFilePath = path.relative(projectDir, sf.getFilePath());

      // Exclude files reserved for configuring the framework.
      if (PastoriaMetadata.RESERVED_FILES.has(projectFilePath)) {
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
