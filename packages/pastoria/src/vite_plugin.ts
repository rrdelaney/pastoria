import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {access} from 'node:fs/promises';
import {
  InlineConfig,
  PluginOption,
  type BuildEnvironmentOptions,
  type Plugin,
} from 'vite';
import {cjsInterop} from 'vite-plugin-cjs-interop';
import {
  generateClientEntry,
  generateServerEntry,
  PastoriaCapabilities,
} from './generate.js';
import {logger} from './logger.js';

async function determineCapabilities(): Promise<PastoriaCapabilities> {
  const capabilities: PastoriaCapabilities = {
    hasAppRoot: false,
    hasServerHandler: false,
  };

  async function hasAppRoot() {
    try {
      await access('__generated__/router/app_root.ts');
      capabilities.hasAppRoot = true;
    } catch {}
  }

  async function hasServerHandler() {
    try {
      await access('__generated__/router/server_handler.ts');
      capabilities.hasServerHandler = true;
    } catch {}
  }

  await Promise.all([hasAppRoot(), hasServerHandler()]);
  return capabilities;
}

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
      const capabilities = await determineCapabilities();
      if (id === clientEntryModuleId) {
        return generateClientEntry(capabilities);
      } else if (id === serverEntryModuleId) {
        return generateServerEntry(capabilities);
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
