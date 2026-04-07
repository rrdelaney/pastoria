import tailwindcss from '@tailwindcss/vite';
import {pastoria} from '@pastoria/vite';
import {defineConfig} from 'vite-plus';

export default defineConfig({
  plugins: [tailwindcss(), pastoria()],
  run: {
    tasks: {
      'generate:schema': {
        command: 'grats',
        input: ['lib/schema/**'],
      },
      'generate:relay': {
        command: 'relay-compiler',
        dependsOn: ['generate:schema'],
        input: ['__generated__/schema/**', 'lib/**', 'pastora/**'],
      },
      generate: {
        command: 'pastoria',
        input: ['pastoria/**'],
        dependsOn: ['generate:relay'],
      },
    },
  },
  fmt: {
    ignorePatterns: ['__generated__/**'],
    proseWrap: 'always',
    bracketSpacing: false,
    singleQuote: true,
  },
  lint: {
    ignorePatterns: ['__generated__/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
