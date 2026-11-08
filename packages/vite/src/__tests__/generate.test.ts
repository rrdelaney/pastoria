import {readFileSync} from 'node:fs';
import * as path from 'node:path';
import {createFileSystemWithLib} from 'typescript/fs';
import {describe, expect, it, vi} from 'vite-plus/test';
import {PastoriaAnalyzer} from '../analyzer.js';
import type {GeneratorFileSystem} from '../fs.js';
import {PastoriaExecutionContext} from '../generate.js';

vi.mock('../logger.js', () => ({logInfo: vi.fn(), logWarn: vi.fn()}));

const REAL_TEMPLATES_DIR = path.join(import.meta.dirname, '../../templates');
const TEMPLATES_DIR = '/templates';
const PROJECT_DIR = '/';

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    jsx: 'react-jsx',
    strict: true,
    noEmit: true,
  },
  include: ['**/*.ts', '**/*.tsx'],
});

function createMemoryFileSystem(
  files: Map<string, string>,
): GeneratorFileSystem {
  return {
    async readFile(filePath) {
      return files.get(filePath);
    },
    async writeFile(filePath, content) {
      files.set(filePath, content);
    },
    async readDir(dirPath) {
      const prefix = dirPath.endsWith('/') ? dirPath : dirPath + '/';
      return [...files.keys()]
        .filter(
          (f) => f.startsWith(prefix) && !f.slice(prefix.length).includes('/'),
        )
        .map((f) => f.slice(prefix.length));
    },
    async deleteFile(filePath) {
      files.delete(filePath);
    },
  };
}

async function generate(
  sources: Record<string, string>,
  {existingOutputs = {}}: {existingOutputs?: Record<string, string>} = {},
) {
  // Files visible to the generator: templates and anything it writes.
  const outputs = new Map<string, string>(Object.entries(existingOutputs));
  for (const name of ['router.tsx', 'js_resource.ts', 'server.ts']) {
    outputs.set(
      path.join(TEMPLATES_DIR, name),
      readFileSync(path.join(REAL_TEMPLATES_DIR, name), 'utf-8'),
    );
  }

  // Files visible to TypeScript: the app's sources.
  const analyzer = new PastoriaAnalyzer({
    projectDir: PROJECT_DIR,
    fileSystem: createFileSystemWithLib([
      ['/tsconfig.json', TSCONFIG],
      ...Object.entries(sources),
    ]),
  });

  try {
    await new PastoriaExecutionContext(analyzer, {
      fileSystem: createMemoryFileSystem(outputs),
      templatesDir: TEMPLATES_DIR,
    }).generatePastoriaArtifacts();
  } finally {
    analyzer.close();
  }

  function getFile(p: string) {
    const content = outputs.get(p);
    if (!content) return '';
    // Strip checksum so snapshots are stable across runs
    return content.replace(
      / \* @generated-checksum [a-f0-9]+\n/,
      ' * @generated-checksum <STRIPPED>\n',
    );
  }

  return {
    outputs,
    getFile,
    get router() {
      return getFile('/__generated__/router/router.tsx');
    },
    get jsResource() {
      return getFile('/__generated__/router/js_resource.ts');
    },
    get server() {
      return getFile('/__generated__/router/server.ts');
    },
    get types() {
      return getFile('/__generated__/router/types.ts');
    },
    entrypoint(name: string) {
      return getFile(`/__generated__/router/${name}.entrypoint.ts`);
    },
  };
}

const DETAILS_QUERY = `
export type page_DetailsQuery$variables = {
  name: string;
  limit?: number | null | undefined;
};
export type page_DetailsQuery$data = {
  readonly greet: string | null | undefined;
};
export type page_DetailsQuery = {
  response: page_DetailsQuery$data;
  variables: page_DetailsQuery$variables;
};
const node = {};
export default node;
`;

describe('generatePastoriaArtifacts', () => {
  describe('empty project', () => {
    it('throws when no pastoria directory exists', async () => {
      await expect(generate({})).rejects.toThrow();
    });
  });

  describe('simple page route', () => {
    it('generates an entrypoint for a page.tsx with default export and no queries', async () => {
      const result = await generate({
        '/pastoria/home/page.tsx': `
export default function HomePage() {
  return null;
}
`,
      });

      const entrypoint = result.entrypoint('home_page');

      // Should have an empty schema since no params
      expect(entrypoint).toContain('z.object({})');
      // Should reference the route resource
      expect(entrypoint).toContain('/home');
      // Should export entrypoint and schema
      expect(entrypoint).toContain(`export {
  entrypoint,
  schema`);

      // Router should have a route for /home
      expect(result.router).toContain(`'/home'`);

      // js_resource should have a resource for route(/home)
      expect(result.jsResource).toContain(`'/home'`);

      expect(entrypoint).toMatchSnapshot();
    });
  });

  describe('dynamic page route with queries', () => {
    it('generates a parameterized entrypoint with query variables', async () => {
      const result = await generate({
        '/pastoria/details/[name]/page.tsx': `
import type {page_DetailsQuery} from '../../../__generated__/queries/page_DetailsQuery.graphql.js';

export type Queries = {
  details: page_DetailsQuery;
};

export default function DetailsPage() {
  return null;
}
`,
        '/__generated__/queries/page_DetailsQuery.graphql.ts': DETAILS_QUERY,
      });

      const entrypoint = result.entrypoint('details_$name_page');

      // Should import the query parameters
      expect(entrypoint).toContain('page_DetailsQueryParameters');
      // Should have the name param in the schema
      expect(entrypoint).toContain(
        'name: z.pipe(z.string(), z.transform(decodeURIComponent))',
      );
      // Optional variables are nullish in the schema
      expect(entrypoint).toContain('limit: z.pipe(');
      expect(entrypoint).toContain('z.nullish(z.coerce.number<number>())');
      // Should pass variables from schema to query
      expect(entrypoint).toContain(
        'variables: { name: variables.name, limit: variables.limit }',
      );

      expect(entrypoint).toMatchSnapshot();
    });
  });

  describe('page with schema, getPreloadProps and nested entrypoints', () => {
    it('copies schema and getPreloadProps and wires nested entrypoints', async () => {
      const result = await generate({
        '/pastoria/details/[name]/page.tsx': `
import type {page_DetailsQuery} from '../../../__generated__/queries/page_DetailsQuery.graphql.js';
import type {EntryPoint} from 'react-relay';
import {z} from 'zod/v4-mini';

export type Queries = {
  details: page_DetailsQuery;
};

export type EntryPoints = {
  banner: EntryPoint<
    ModuleType<'/details/[name]#banner'>,
    ModuleParams<'/details/[name]#banner'>
  >;
  maybeSidebar?:
    | EntryPoint<ModuleType<'/details/[name]#sidebar'>, ModuleParams<'/details/[name]#sidebar'>>
    | undefined;
};

export type ExtraProps = {tab: string};

export const schema = z.object({
  name: z.string(),
  tab: z.nullish(z.string()),
});

export const getPreloadProps: GetPreloadProps<'/details/[name]'> = ({
  variables,
  queries,
  entryPoints,
}) => ({
  queries: {details: queries.details({name: variables.name})},
  entryPoints: {banner: entryPoints.banner({})},
  extraProps: {tab: variables.tab ?? 'overview'},
});

export default function DetailsPage() {
  return null;
}
`,
        '/pastoria/details/[name]/banner.tsx': `
export type RuntimeProps = {suffix: string};

export default function Banner() {
  return null;
}
`,
        '/pastoria/details/[name]/sidebar.tsx': `
export default function Sidebar() {
  return null;
}
`,
        '/__generated__/queries/page_DetailsQuery.graphql.ts': DETAILS_QUERY,
      });

      const page = result.entrypoint('details_$name_page');

      // Schema is copied verbatim from the page.
      expect(page).toContain(`const schema = z.object({
  name: z.string(),
  tab: z.nullish(z.string()),
});`);
      // getPreloadProps is inlined and given helper factories.
      expect(page).toContain('extraProps: { tab: variables.tab ??');
      expect(page).toContain(
        "['banner']: (entryPointParams) => ({\n          entryPoint: details_$name_banner_entrypoint,",
      );
      expect(page).toContain(
        "['maybeSidebar']: (entryPointParams) => ({\n          entryPoint: details_$name_sidebar_entrypoint,",
      );
      expect(page).toContain("from './details_$name_banner.entrypoint'");
      expect(page).toContain("from './details_$name_sidebar.entrypoint'");
      expect(page).toMatch(
        /import type \{\s*EntryPoints,\s*Queries,\s*ExtraProps,?\s*\}/,
      );

      // Non-page modules become nested resources with their own entrypoint.
      expect(result.jsResource).toContain(`'/details/[name]#banner'`);
      expect(result.jsResource).toContain(`'/details/[name]#sidebar'`);
      const banner = result.entrypoint('details_$name_banner');
      expect(banner).toContain('import type { RuntimeProps }');
      expect(banner).not.toContain('type RuntimeProps = {');

      expect(result.types).toContain(`| '/details/[name]#banner'`);

      expect(page).toMatchSnapshot();
    });
  });

  describe('server route', () => {
    it('generates a server.ts with express route handler', async () => {
      const result = await generate({
        '/pastoria/api/greet/[name]/route.ts': `
export default function handler(req: unknown, res: {json(v: unknown): void}) {
  res.json({greeting: 'hello'});
}
`,
      });

      // Should have an import from the route file
      expect(result.server).toContain('../../pastoria/api/greet/[name]/route');
      // Should register the route with express
      expect(result.server).toContain("router.use('/api/greet/:name'");

      expect(result.server).toMatchSnapshot();
    });
  });

  describe('multiple routes', () => {
    it('generates output with multiple page and server routes', async () => {
      const result = await generate({
        '/pastoria/home/page.tsx': `
export default function HomePage() {
  return null;
}
`,
        '/pastoria/about/page.tsx': `
export default function AboutPage() {
  return null;
}
`,
        '/pastoria/api/health/route.ts': `
export default function health(req: any, res: any) {
  res.json({ok: true});
}
`,
        '/pastoria/api/greet/[name]/route.ts': `
export default function greet(req: any, res: any) {
  res.json({greeting: 'hello'});
}
`,
      });

      // Router should have both page routes
      expect(result.router).toContain(`'/home'`);
      expect(result.router).toContain(`'/about'`);

      // js_resource should have both page resources
      expect(result.jsResource).toContain(`'#pastoria/home/page'`);
      expect(result.jsResource).toContain(`'#pastoria/about/page'`);

      // Server should have both API routes
      expect(result.server).toContain("'/api/health'");
      expect(result.server).toContain("'/api/greet/:name'");

      // Should generate both entrypoint files
      expect(result.entrypoint('home_page')).not.toBe('');
      expect(result.entrypoint('about_page')).not.toBe('');

      expect(result.router).toMatchSnapshot();
      expect(result.jsResource).toMatchSnapshot();
      expect(result.server).toMatchSnapshot();
    });
  });

  describe('stale entrypoints', () => {
    it('removes entrypoint files for resources that no longer exist', async () => {
      const result = await generate(
        {
          '/pastoria/home/page.tsx': `export default function HomePage() { return null; }`,
        },
        {
          existingOutputs: {
            '/__generated__/router/removed_page.entrypoint.ts': '// stale',
          },
        },
      );

      expect(
        result.outputs.has('/__generated__/router/removed_page.entrypoint.ts'),
      ).toBe(false);
      expect(result.entrypoint('home_page')).not.toBe('');
    });
  });
});
