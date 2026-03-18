import {defineConfig} from 'vite-plus';

export default defineConfig({
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
