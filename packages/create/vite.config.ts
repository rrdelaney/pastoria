import {defineConfig} from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'vp pack && cp ../../pnpm-workspace.yaml dist/',
      },
      check: {
        command: 'vp check',
      },
    },
  },
  pack: {
    format: ['esm'],
    dts: true,
    deps: {skipNodeModulesBundle: true},
  },
});
