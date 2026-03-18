import tailwindcss from '@tailwindcss/vite';
import {pastoria} from '@pastoria/vite';
import {defineConfig} from 'vite-plus';

export default defineConfig({
  plugins: [tailwindcss(), pastoria()],
  fmt: {
    proseWrap: 'always',
    bracketSpacing: false,
    singleQuote: true,
  },
  lint: {
    ignorePatterns: ['__generated__/router/*'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
