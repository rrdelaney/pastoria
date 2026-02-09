import {readFileSync} from 'node:fs';
import * as path from 'node:path';
import {Project, ts} from 'ts-morph';
import {describe, expect, it, vi} from 'vitest';
import {PastoriaExecutionContext} from '../generate.js';

vi.mock('../logger.js', () => ({logInfo: vi.fn(), logWarn: vi.fn()}));

// Read real template files once (before any mocking)
const REAL_TEMPLATES_DIR = path.join(import.meta.dirname, '../../templates');
const TEMPLATES: Record<string, string> = {
  'router.tsx': readFileSync(
    path.join(REAL_TEMPLATES_DIR, 'router.tsx'),
    'utf-8',
  ),
  'js_resource.ts': readFileSync(
    path.join(REAL_TEMPLATES_DIR, 'js_resource.ts'),
    'utf-8',
  ),
  'server.ts': readFileSync(
    path.join(REAL_TEMPLATES_DIR, 'server.ts'),
    'utf-8',
  ),
};

const TEMPLATES_DIR = '/templates';
const PROJECT_DIR = '/';

async function generate(files: Record<string, string>) {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
    },
  });

  // Write templates to in-memory FS
  const fs = project.getFileSystem();
  for (const [name, content] of Object.entries(TEMPLATES)) {
    fs.writeFileSync(path.join(TEMPLATES_DIR, name), content);
  }

  // Write test fixture files
  for (const [filePath, content] of Object.entries(files)) {
    project.createSourceFile(filePath, content);
  }

  await new PastoriaExecutionContext(
    project,
    TEMPLATES_DIR,
    PROJECT_DIR,
  ).generatePastoriaArtifacts();

  function getFile(p: string) {
    const content = project.getSourceFile(p)?.getFullText();
    if (!content) return '';
    // Strip checksum so snapshots are stable across runs
    return content.replace(
      / \* @generated-checksum [a-f0-9]+\n/,
      ' * @generated-checksum <STRIPPED>\n',
    );
  }

  return {
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
    entrypoint(routeName: string) {
      return getFile(`/__generated__/router/${routeName}_page.entrypoint.ts`);
    },
  };
}

describe('generatePastoriaArtifacts', () => {
  describe('empty project', () => {
    it('generates router, js_resource, and server with empty configs', async () => {
      const result = await generate({});

      // Router config should have no routes (noop removed, nothing added)
      expect(result.router).toContain('const ROUTER_CONF = {');
      expect(result.router).not.toContain('noop');

      // js_resource config should have no resources (noop removed)
      expect(result.jsResource).toContain('const RESOURCE_CONF = {');
      expect(result.jsResource).not.toContain('noop');

      // server should have no route handlers added
      expect(result.server).toContain(
        'export const router = express.Router();',
      );
      expect(result.server).not.toContain('router.use(');

      expect(result.router).toMatchSnapshot();
      expect(result.jsResource).toMatchSnapshot();
      expect(result.server).toMatchSnapshot();
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

      const entrypoint = result.entrypoint('home');

      expect(entrypoint).toBeDefined();
      // Should have an empty schema since no params
      expect(entrypoint).toContain('z.object({})');
      // Should reference the route resource
      expect(entrypoint).toContain('#pastoria/home/page');
      // Should export entrypoint and schema
      expect(entrypoint).toContain('export { entrypoint, schema');

      // Router should have a route for /home
      expect(result.router).toContain(`'/home'`);

      // js_resource should have a resource for route(/home)
      expect(result.jsResource).toContain(`'#pastoria/home/page'`);

      expect(entrypoint).toMatchSnapshot();
    });
  });

  describe('dynamic page route with queries', () => {
    it('generates a parameterized entrypoint with query variables', async () => {
      const result = await generate({
        '/pastoria/details/[name]/page.tsx': `
import {graphql, usePreloadedQuery} from 'react-relay';
import {page_DetailsQuery} from '#genfiles/queries/page_DetailsQuery.graphql.js';

export type Queries = {
  details: page_DetailsQuery;
};

export default function DetailsPage({queries}: PastoriaPageProps<'/details/[name]'>) {
  return null;
}
`,
        // Minimal Relay-generated query type file
        '/__generated__/queries/page_DetailsQuery.graphql.ts': `
export type page_DetailsQuery$variables = {
  name: string;
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
`,
      });

      const entrypoint = result.entrypoint('details_$name');

      expect(entrypoint).toBeDefined();
      // Should import the query parameters
      expect(entrypoint).toContain('page_DetailsQueryParameters');
      // Should have the name param in the schema
      expect(entrypoint).toContain('name:');
      // Should pass variables from schema to query
      expect(entrypoint).toContain('variables.name');

      expect(entrypoint).toMatchSnapshot();
    });
  });

  describe('server route', () => {
    it('generates a server.ts with express route handler', async () => {
      const result = await generate({
        '/pastoria/api/greet/[name]/route.ts': `
import type {Request, Response} from 'express';

export default function handler(req: Request, res: Response) {
  res.json({greeting: 'hello'});
}
`,
      });

      // Should have an import from the route file
      expect(result.server).toContain('pastoria/api/greet/[name]/route');
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
      expect(result.entrypoint('home')).toBeDefined();
      expect(result.entrypoint('about')).toBeDefined();

      expect(result.router).toMatchSnapshot();
      expect(result.jsResource).toMatchSnapshot();
      expect(result.server).toMatchSnapshot();
    });
  });
});
