import {defineConfig} from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      build: {command: 'vp pack'},
      check: {command: 'vp check'},
      test: {command: 'vp test'},
    },
  },
  pack: {
    entry: ['src/cli.ts', 'src/vite.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    deps: {
      skipNodeModulesBundle: true,
    },
  },
  test: {
    root: '.',
  },
});
