import babel from '@rolldown/plugin-babel';
import stylexPluginImport from '@stylexjs/unplugin/vite';
import react, {reactCompilerPreset} from '@vitejs/plugin-react';
import cookieParser from 'cookie-parser';
import express from 'express';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import {
  createLogger,
  type Manifest,
  type Plugin,
  type ViteDevServer,
} from 'vite';
import {cjsInterop} from 'vite-plugin-cjs-interop';
import {PastoriaAnalyzer} from './analyzer.js';
import {PastoriaExecutionContext} from './generate.js';
import {logInfo} from './logger.js';
import {createHandler} from '@pastoria/server';
import dotenv from 'dotenv';

const stylex =
  stylexPluginImport as unknown as (typeof stylexPluginImport)['default'];

type ViteMode = 'development' | 'production';

const logger = createLogger('info', {
  prefix: pc.greenBright('[pastoria]'),
});

export function pastoria(): Plugin[] {
  return [
    pastoriaEntryPlugin(),
    stylex({useCSSLayers: true}),
    react(),
    babel({
      presets: [reactCompilerPreset()],
      plugins: [['relay']],
    }),
    cjsInterop({
      dependencies: ['react-relay', 'react-relay/hooks', 'relay-runtime'],
    }),
  ];
}

function pastoriaEntryPlugin(): Plugin {
  const clientEntryModuleId = 'virtual:pastoria-entry-client.tsx';
  const serverEntryModuleId = 'virtual:pastoria-entry-server.tsx';
  // Created lazily so builds that never generate don't start a tsgo process.
  let analyzer: PastoriaAnalyzer | undefined;
  function getAnalyzer() {
    analyzer ??= new PastoriaAnalyzer({projectDir: process.cwd()});
    return analyzer;
  }

  function closeAnalyzer() {
    analyzer?.close();
    analyzer = undefined;
  }

  async function generate() {
    logInfo('Updating generated files');
    await new PastoriaExecutionContext(
      getAnalyzer(),
    ).generatePastoriaArtifacts();
  }

  let mode: ViteMode = 'development';
  let shouldGenerateOnBuildStart = false;

  return {
    name: 'pastoria',
    config() {
      return {
        appType: 'custom' as const,
        builder: {},
        customLogger: logger,
        build: {
          assetsInlineLimit: 0,
          manifest: true,
          ssrManifest: true,
          outDir: 'dist/client',
          rollupOptions: {
            input: 'virtual:pastoria-entry-client.tsx',
          },
        },
        ssr: {
          noExternal: ['@pastoria/runtime'],
        },
        environments: {
          ssr: {
            build: {
              outDir: 'dist/server',
              ssr: true,
              rollupOptions: {
                input: 'virtual:pastoria-entry-server.tsx',
              },
            },
          },
        },
      };
    },
    configResolved(config) {
      if (config.mode === 'production') {
        mode = 'production';
      }

      if (config.command === 'serve') {
        shouldGenerateOnBuildStart = true;
      }
    },
    configureServer(server) {
      dotenv.config();

      return () => {
        server.middlewares.use(
          express()
            .use(cookieParser())
            .use(createPastoriaDevRouteHandler(server)),
        );
      };
    },
    async configurePreviewServer(server) {
      dotenv.config();

      const app = express()
        .use(cookieParser())
        .use(await createHandler());

      server.middlewares.use(app);
    },
    resolveId(id) {
      if (id === clientEntryModuleId) {
        return clientEntryModuleId; // Return without \0 prefix so React plugin can see .tsx extension
      } else if (id === serverEntryModuleId) {
        return serverEntryModuleId;
      }
    },
    async load(id) {
      if (id === clientEntryModuleId) {
        return generateClientEntry(mode);
      } else if (id === serverEntryModuleId) {
        return generateServerEntry();
      }
    },
    async buildStart() {
      if (!shouldGenerateOnBuildStart) {
        return;
      }

      await generate();
    },
    async watchChange(id, {event}) {
      if (!/\.tsx?$/.test(id) || id.includes('__generated__/router')) return;

      getAnalyzer().notifyChanges({
        changed: event === 'update' ? [id] : [],
        created: event === 'create' ? [id] : [],
        deleted: event === 'delete' ? [id] : [],
      });

      // Changes to Relay artifacts can change query variables, but only
      // sources under pastoria/ can change the set of routes and entrypoints.
      const pastoriaDir = path.join(process.cwd(), 'pastoria') + path.sep;
      const queriesDir =
        path.join(process.cwd(), '__generated__/queries') + path.sep;
      if (id.startsWith(pastoriaDir) || id.startsWith(queriesDir)) {
        await generate();
      }
    },
    buildEnd() {
      if (!this.meta.watchMode) closeAnalyzer();
    },
    closeWatcher() {
      closeAnalyzer();
    },
  };
}

interface ServerEntry {
  createHandler(
    this: void,
    persistedQueries: {
      [hash: string]: string;
    },
    manifest?: Manifest,
  ): express.Router;
}

function createPastoriaDevRouteHandler(
  viteServer: ViteDevServer,
): express.Handler {
  return async (req, res, next) => {
    const persistedQueries = JSON.parse(
      await readFile('__generated__/router/persisted_queries.json', 'utf-8'),
    );

    const {createHandler: createDevHander} = (await viteServer.ssrLoadModule(
      'virtual:pastoria-entry-server.tsx',
    )) as ServerEntry;

    const handler = createDevHander(persistedQueries);
    handler(req, res, next);
  };
}

function generateClientEntry(mode: ViteMode): string {
  return `// Generated by Pastoria.
${mode === 'development' ? `import '@vitejs/plugin-react/preamble';` : ''}
import {createRouterApp} from '#genfiles/router/router';
import App from '#pastoria/app';
import {hydrateRoot} from 'react-dom/client';

async function main() {
  const RouterApp = await createRouterApp();
  hydrateRoot(document, <RouterApp App={App} />);
}

main();
`;
}

function generateServerEntry(): string {
  return `// Generated by Pastoria.
import {JSResource} from '#genfiles/router/js_resource';
import {
  listRoutes,
  router__createAppFromEntryPoint,
  router__loadEntryPoint,
} from '#genfiles/router/router';
import {router as serverRouter} from '#genfiles/router/server';
import App from '#pastoria/app';
import environment from '#pastoria/environment';
import express from 'express';
import {createRouterHandler} from '@pastoria/runtime/server';
import type {Manifest} from 'vite';

export function createHandler(
  persistedQueries: Record<string, string>,
  manifest?: Manifest,
) {
  const routeHandler = createRouterHandler(
    listRoutes(),
    JSResource.srcOfModuleId,
    router__loadEntryPoint,
    router__createAppFromEntryPoint,
    App,
    environment,
    persistedQueries,
    manifest,
  );

  const router = express.Router();
  router.use(routeHandler);
  router.use(serverRouter)

  return router;
}
`;
}
