import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {
  InlineConfig,
  PluginOption,
  type BuildEnvironmentOptions,
  type Plugin,
} from 'vite';
import {cjsInterop} from 'vite-plugin-cjs-interop';
import {generateClientEntry, generateServerEntry} from './generate.js';
import {logger} from './logger.js';

function pastoriaEntryPlugin(): Plugin {
  const clientEntryModuleId = 'virtual:pastoria-entry-client.tsx';
  const serverEntryModuleId = 'virtual:pastoria-entry-server.tsx';

  return {
    name: 'pastoria-entry',
    resolveId(id) {
      if (id === clientEntryModuleId) {
        return clientEntryModuleId; // Return without \0 prefix so React plugin can see .tsx extension
      } else if (id === serverEntryModuleId) {
        return serverEntryModuleId;
      }
    },
    async load(id) {
      if (id === clientEntryModuleId) {
        return generateClientEntry();
      } else if (id === serverEntryModuleId) {
        return generateServerEntry();
      }
    },
  };
}

export const CLIENT_BUILD: BuildEnvironmentOptions = {
  outDir: 'dist/client',
  rollupOptions: {
    input: 'virtual:pastoria-entry-client.tsx',
  },
};

export const SERVER_BUILD: BuildEnvironmentOptions = {
  outDir: 'dist/server',
  ssr: true,
  rollupOptions: {
    input: 'virtual:pastoria-entry-server.tsx',
  },
};

export function createBuildConfig(
  buildEnv: BuildEnvironmentOptions,
): InlineConfig {
  return {
    appType: 'custom' as const,
    customLogger: logger,
    build: {
      ...buildEnv,
      assetsInlineLimit: 0,
      manifest: true,
      ssrManifest: true,
    },
    plugins: [
      pastoriaEntryPlugin(),
      tailwindcss() as PluginOption,
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}], 'relay'],
        },
      }),
      cjsInterop({
        dependencies: ['react-relay', 'react-relay/hooks', 'relay-runtime'],
      }),
    ],
    ssr: {
      noExternal: ['pastoria-runtime'],
    },
  };
}
