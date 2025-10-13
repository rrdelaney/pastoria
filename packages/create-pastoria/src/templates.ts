export const templates: Record<string, () => object | string> = {
  'package.json': () => ({
    name: 'my-pastoria-app',
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      format: 'prettier -w .',
      'generate:schema': 'grats',
      'generate:relay': 'relay-compiler',
      'generate:router': 'pastoria gen',
      build: 'pastoria build',
      dev: 'pastoria dev',
      start: 'NODE_ENV=production pastoria-server',
    },
    imports: {
      '#src/*': './src/*',
      '#genfiles/*': './__generated__/*',
    },
    dependencies: {
      '@graphql-yoga/plugin-persisted-operations': '^3.16.0',
      dataloader: '^2.2.3',
      dotenv: '^16.6.1',
      express: '^5.1.0',
      graphql: '^16.11.0',
      'graphql-relay': '^0.10.2',
      'graphql-yoga': '^5.16.0',
      grats: '^0.0.33',
      'pastoria-runtime': '^1.0.3',
      'pastoria-server': '^1.0.4',
      react: '^19.2.0',
      'react-dom': '^19.2.0',
      'react-relay': '^20.1.1',
      'relay-runtime': '^20.1.1',
    },
    devDependencies: {
      '@tailwindcss/vite': '^4.1.14',
      '@types/node': '^22.18.8',
      '@types/react': '^19.2.2',
      '@types/react-dom': '^19.2.1',
      '@types/react-relay': '^18.2.1',
      '@types/relay-runtime': '^19.0.3',
      '@vitejs/plugin-react': '^4.7.0',
      'babel-plugin-relay': '^16.2.0',
      pastoria: '^1.0.5',
      prettier: '^3.6.2',
      'prettier-plugin-tailwindcss': '^0.6.14',
      'relay-compiler': '^20.1.1',
      'relay-config': '^12.0.1',
      tailwindcss: '^4.1.14',
      typescript: '^5.9.3',
      'vite-plugin-cjs-interop': '^2.3.0',
    },
  }),

  'relay.config.json': () => ({
    src: './src',
    schema: './__generated__/schema/schema.graphql',
    language: 'typescript',
    excludes: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**'],
    artifactDirectory: './__generated__/queries',
    eagerEsModules: true,
    persistConfig: {
      file: './__generated__/persisted_queries.json',
    },
  }),

  'tsconfig.json': () => ({
    compilerOptions: {
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      strictNullChecks: true,
      noUncheckedIndexedAccess: true,
      target: 'esnext',
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      paths: {
        '#src/*': ['./src/*'],
        '#genfiles/*': ['./__generated__/*'],
      },
    },
    include: [
      '__generated__/**/*.ts',
      '__generated__/**/*.tsx',
      'src/**/*.ts',
      'src/**/*.tsx',
    ],
    exclude: ['node_modules'],
    grats: {
      graphqlSchema: './__generated__/schema/schema.graphql',
      tsSchema: './__generated__/schema/schema.ts',
      nullableByDefault: true,
      strictSemanticNullability: true,
    },
  }),

  '.prettierrc.json': () => ({
    $schema: 'https://json.schemastore.org/prettierrc',
    plugins: ['prettier-plugin-tailwindcss'],
    proseWrap: 'always',
    bracketSpacing: false,
    singleQuote: true,
  }),

  '.gitignore': () => `# dependencies
/node_modules
/.pnp
.pnp.js
package-lock.json

# testing
/coverage

# production
/build
dist/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
*.env*

# typescript
*.tsbuildinfo
`,

  'src/lib/server/context.ts': () => `import DataLoader from 'dataloader';

/**
 * GraphQL context class providing request-scoped caching and data loading.
 *
 * @gqlContext
 */
export class Context {
  constructor() {}

  private readonly DERIVED_CACHE = new Map<string, unknown>();

  /**
   * Get or create a derived value with caching.
   * Useful for creating DataLoaders or other per-request singletons.
   */
  derived = <T>(key: string, make: () => T): T => {
    if (!this.DERIVED_CACHE.has(key)) {
      this.DERIVED_CACHE.set(key, make());
    }

    return this.DERIVED_CACHE.get(key) as T;
  };

  /**
   * Create or get a cached DataLoader instance.
   * Prevents duplicate requests within a single GraphQL operation.
   */
  loader = <K, V>(
    key: string,
    batchLoadFn: DataLoader.BatchLoadFn<K, V>,
  ): DataLoader<K, V> => {
    return this.derived(key, () => new DataLoader(batchLoadFn));
  };
}

/**
 * Factory function to create a new Context for each GraphQL request.
 * Add your database connections, authentication, etc. here.
 */
export function createContext(): Context {
  return new Context();
}
`,

  'src/pages/index.tsx': () => `/**
 * @route /
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Welcome to Pastoria!</h1>
        <p className="mt-4 text-gray-600">
          Your full-stack JavaScript framework is ready.
        </p>
      </div>
    </div>
  );
}
`,

  'src/pages/_app.tsx': () => `import type {ReactNode} from 'react';

type AppRootProps = {
  children: ReactNode;
};

/**
 * @appRoot
 */
export default function AppRoot({children}: AppRootProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pastoria App</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
`,

  'src/lib/schema/hello.ts': () => `import {Context} from '../server/context.js';

/**
 * A simple hello world query that returns a greeting message.
 *
 * @gqlQueryField
 */
export function hello(ctx: Context): string {
  return 'Hello from Pastoria!';
}

/**
 * Example query showing how to accept arguments.
 * Try querying: { greet(name: "World") }
 *
 * @gqlQueryField
 */
export function greet(args: {name: string}, ctx: Context): string {
  return \`Hello, \${args.name}! Welcome to Pastoria.\`;
}
`,

  'public/.gitkeep': () => '',

  '__generated__/persisted_queries.json': () => ({}),

  '.env.example': () => `# Add your environment variables here
`,
};
