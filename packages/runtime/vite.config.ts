import {defineConfig} from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      build: {command: 'vp pack'},
      check: {command: 'vp check'},
    },
  },
  pack: {
    entry: ['src/index.ts', 'src/server/index.ts'],
    format: ['esm'],
    dts: true,
    deps: {
      skipNodeModulesBundle: true,
    },
  },
});
