import {defineConfig} from 'vite-plus';

export default defineConfig({
  lint: {
    options: {typeAware: true, typeCheck: true},
    ignorePatterns: ['examples/*/__generated__'],
  },
  fmt: {
    sortTailwindcss: {},
    proseWrap: 'always',
    bracketSpacing: false,
    singleQuote: true,
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'out/',
      '.docusaurus/',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      'coverage/',
      '.turbo/',
      'examples/*/__generated__',
    ],
  },
});
