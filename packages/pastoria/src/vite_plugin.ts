import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {Project} from 'ts-morph';
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
  PastoriaExecutionContext,
} from './generate.js';
import {logger, logInfo} from './logger.js';

function pastoriaEntryPlugin(project: Project): Plugin {
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
    async buildStart() {
      logInfo('Updating generated files');
      await new PastoriaExecutionContext(project).generatePastoriaArtifacts();
    },
    async watchChange(id, {event}) {
      if (!id.match(/.tsx$/) || id.includes('__generated__')) return;

      if (event === 'create') {
        project.addSourceFileAtPath(id);
      } else if (event === 'delete') {
        project.getSourceFile(id)?.forget();
      } else if (event === 'update') {
        await project.getSourceFile(id)?.refreshFromFileSystem();
      }

      logInfo('Updating generated files');
      await new PastoriaExecutionContext(project).generatePastoriaArtifacts();
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
  project: Project,
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
      pastoriaEntryPlugin(project),
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
