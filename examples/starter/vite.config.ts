import {pastoria} from '@pastoria/vite';
import {defineConfig} from 'vite-plus';

export default defineConfig({
  plugins: [pastoria()],
  fmt: {
    sortTailwindcss: {},
    proseWrap: 'always',
    bracketSpacing: false,
    singleQuote: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
