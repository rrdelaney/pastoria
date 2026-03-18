import {defineConfig} from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts', 'src/cli.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    deps: {
      skipNodeModulesBundle: true,
    },
  },
});
