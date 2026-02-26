# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Pastoria is a full-stack JavaScript framework for building data-driven
applications. This repository contains only the framework itself - not an
application built with it. The framework combines:

- **File-based routing** with type-safe navigation and Zod param validation
- **React Relay** for GraphQL data fetching with persisted queries and
  entrypoint-based preloading
- **Vite** for build tooling and dev server
- **Server-side rendering (SSR)** with React
- **TailwindCSS** for styling
- **Code generation** that wires routes, queries, and entrypoints together
  automatically

## Monorepo Structure

This is a pnpm workspace monorepo with the following packages:

- **`packages/pastoria`**: Main CLI tool that provides `generate`, `dev`, and
  `build` commands for framework users
- **`packages/pastoria-runtime`**: Runtime utilities for routing, Relay
  environments, and server handlers
- **`packages/pastoria-server`**: Standalone production server for framework
  users
- **`packages/create-pastoria`**: Scaffolding tool for creating new Pastoria
  projects

The `website/` directory contains a Docusaurus docs site but is outdated and
should be ignored.

## Common Commands

### Building the Framework

```bash
# Build the framework packages
pnpm run --filter './packages/*' build

# Type check all packages
pnpm check:types
```

### Formatting

```bash
# Format code
pnpm format

# Check formatting
pnpm check:format
```

### Publishing

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm changeset version

# Install to update lockfile
pnpm install

# Build all packages
pnpm run -r build

# Publish to npm
pnpm publish -r
```

## What a Pastoria App Looks Like

### App Directory Structure

A Pastoria app has this layout:

```
my-app/
  pastoria/                          # Framework source directory
    app.tsx                          # App shell (wraps all pages)
    environment.ts                   # PastoriaEnvironment config (GraphQL schema)
    globals.css                      # Global styles (imports tailwindcss)
    page.tsx                         # Route: /
    about/page.tsx                   # Route: /about
    hello/[name]/
      page.tsx                       # Route: /hello/[name]
      banner.tsx                     # Nested entrypoint: /hello/[name]#banner
      results.tsx                    # Nested entrypoint: /hello/[name]#results
    api/greet/[name]/
      route.ts                       # Server API route: /api/greet/:name
  src/                               # Shared app code, schema resolvers, etc.
  __generated__/                     # All generated code (never hand-edit)
    router/                          # Pastoria-generated router artifacts
    queries/                         # Relay-generated query artifacts
    schema/                          # grats-generated GraphQL schema
  package.json
  tsconfig.json
  relay.config.json
```

### Path Aliases

Apps use Node.js subpath imports (configured in both `package.json` `"imports"`
and `tsconfig.json` `"paths"`). Two are required by the framework:

- `#pastoria/*` → `./pastoria/*`
- `#genfiles/*` → `./__generated__/*`

Apps conventionally also add `#src/*` → `./src/*` for their own code, but this
is not required by the framework.

### App Configuration

**`pastoria/environment.ts`** — exports a `PastoriaEnvironment` instance:

```ts
import {PastoriaEnvironment} from 'pastoria-runtime/server';
export default new PastoriaEnvironment({
  schema, // GraphQLSchema (required)
  createContext: (req) => new Context(), // per-request context factory
  enableGraphiQLInProduction: false,
  persistedQueriesOnlyInProduction: true,
});
```

**`pastoria/app.tsx`** — the app shell component wrapping all pages. If present,
replaces the default HTML shell:

```tsx
import type {PropsWithChildren} from 'react';
import './globals.css';

export default function AppRoot({children}: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>My App</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "generate": "grats && relay-compiler && pastoria generate",
    "build": "pastoria build",
    "dev": "pastoria dev",
    "start": "NODE_ENV=production pastoria-server"
  }
}
```

The generate pipeline is a three-step sequence: `grats` (GraphQL schema from TS
JSDoc) → `relay-compiler` (Relay query artifacts) → `pastoria generate` (router,
entrypoints, types).

## File-Based Routing

### Route Conventions

- **`page.tsx`** — any file named `page.tsx` under `pastoria/` becomes a
  navigable route. The directory path maps to the URL. Dynamic segments use
  `[param]` notation:
  - `pastoria/hello/[name]/page.tsx` → route `/hello/[name]`
  - `pastoria/search/page.tsx` → route `/search`
- **Non-page `.tsx` files** — any other `.tsx` file under `pastoria/` (excluding
  `app.tsx` and `environment.ts`) becomes a **nested entrypoint** (lazy
  sub-component). Its ID uses `#` to separate path from filename:
  - `pastoria/hello/[name]/banner.tsx` → `/hello/[name]#banner`
- **`route.ts`** — files named `route.ts` become Express API handlers mounted at
  the corresponding path:
  - `pastoria/api/greet/[name]/route.ts` → Express: `/api/greet/:name`
- **Reserved files** — `app.tsx`, `app.ts`, and `environment.ts` are framework
  config files and are never treated as routes.

### Route Matching and Params

The generated router uses `radix3` for URL matching. Route parameters (path
params + search params) are parsed through a **Zod schema**. The schema is
either:

1. Auto-generated from the GraphQL query variables of the page's queries, or
2. Explicitly exported as a `schema` constant from the page file (for custom
   validation, optional search params, type coercion, etc.)

```ts
import {z} from 'zod/v4-mini';
export const schema = z.object({
  name: z.string(),
  q: z.nullish(z.string()), // optional search param
  minSize: z.nullish(z.coerce.number()), // coerced number param
});
```

### Client-Side Navigation

The generated router exposes type-safe navigation hooks:

```ts
const {push, replace, pushRoute, replaceRoute} = useNavigation();

// Type-safe: route ID + params object
pushRoute('/hello/[name]', {name: 'world'});
replaceRoute('/search', {q: 'cities'});

// Link components
<Link href="/hello/world">...</Link>
<RouteLink route="/hello/[name]" params={{name: 'world'}}>...</RouteLink>
```

Route IDs use bracket notation as the canonical identifier (e.g.
`'/hello/[name]'`). `pushRoute` fills path params and puts remaining params in
the query string.

## Page Component API

### Minimal Page

```tsx
export default function HomePage() {
  return <div>Hello</div>;
}
```

### Page with Relay Queries

Pages declare queries via an exported `Queries` type and receive preloaded refs
via `PastoriaPageProps`:

```tsx
import {page_HelloQuery} from '#genfiles/queries/page_HelloQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  hello: page_HelloQuery;
};

export default function HelloPage({
  queries,
}: PastoriaPageProps<'/hello/[name]'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query page_HelloQuery($name: String!) @preloadable {
        greet(name: $name)
      }
    `,
    queries.hello,
  );
  return <div>{greet}</div>;
}
```

Queries **must** use the `@preloadable` directive so Relay generates
`$parameters` files for server-side preloading. Query naming convention is
`<filename>_<QueryName>` (e.g. `page_HelloQuery` for a query in `page.tsx`).

### `PastoriaPageProps<R>`

The global type `PastoriaPageProps<R>` (generated in `types.ts`) provides all
props to page and sub-component default exports:

```ts
export default function Page({
  queries, // preloaded Relay query refs
  entryPoints, // preloaded nested entrypoint refs
  props, // RuntimeProps (auto for pages: {pathname, searchParams})
  extraProps, // extra static data from getPreloadProps
}: PastoriaPageProps<'/route'>) {}
```

### Exports a Page Can Have

| Export             | Required | Purpose                                            |
| ------------------ | -------- | -------------------------------------------------- |
| `default`          | Yes      | React component                                    |
| `type Queries`     | No       | Map of query ref name → Relay query type           |
| `type EntryPoints` | No       | Map of entrypoint name → Relay EntryPoint type     |
| `type ExtraProps`  | No       | Extra data shape from `getPreloadProps`            |
| `schema`           | No       | Zod schema for URL param parsing                   |
| `getPreloadProps`  | No       | Custom preload function (auto-generated if absent) |

**Do NOT export `RuntimeProps` from a `page.tsx`** — pages automatically receive
`{pathname: string; searchParams: URLSearchParams}` as RuntimeProps.

### `getPreloadProps`

Controls how URL params map to query variables and which nested entrypoints to
load. If not exported, Pastoria auto-generates one that wires all query
variables from URL params.

```tsx
export const getPreloadProps: GetPreloadProps<'/hello/[name]'> = ({
  variables, // Zod-parsed URL params
  queries, // factory functions: (vars) => ThinQueryParams
  entryPoints, // factory functions: (params) => ThinNestedEntryPointParams
}) => ({
  queries: {
    hello: queries.hello({name: variables.name}),
  },
  entryPoints: {
    banner: entryPoints.banner({}),
    results: variables.q ? entryPoints.results({q: variables.q}) : undefined,
  },
  extraProps: {
    query: variables.q ?? '',
  },
});
```

### ExtraProps

For computed/derived data that doesn't come from queries or URL params. Set in
`getPreloadProps`, received in the component via `extraProps`:

```tsx
export type ExtraProps = {query: string; sortBy: string};

export const getPreloadProps: GetPreloadProps<'/'> = ({
  variables,
  queries,
}) => ({
  queries: {commandersRef: queries.commandersRef(variables)},
  extraProps: {
    sortBy: variables.sortBy ?? 'POPULARITY',
    query: variables.q ?? '',
  },
});
```

## Nested Entrypoints (Sub-Components)

Any `.tsx` file in `pastoria/` that is not `page.tsx`, `app.tsx`, or
`environment.ts` becomes a nested entrypoint — a lazily loaded sub-component for
code-splitting.

### Declaring in a Parent Page

```tsx
import {ModuleType, ModuleParams} from '#genfiles/router/js_resource';
import {EntryPoint, EntryPointContainer} from 'react-relay';

export type EntryPoints = {
  banner: EntryPoint<
    ModuleType<'/hello/[name]#banner'>,
    ModuleParams<'/hello/[name]#banner'>
  >;
};
```

### Rendering

```tsx
<EntryPointContainer
  entryPointReference={entryPoints.banner}
  props={{helloMessageSuffix: '!'}} // becomes RuntimeProps in child
/>
```

### The Sub-Component

```tsx
export type Queries = {bannerRef: banner_Query};

export type RuntimeProps = {
  helloMessageSuffix: string; // passed from parent's EntryPointContainer props
};

export default function Banner({
  queries,
  props, // RuntimeProps
}: PastoriaPageProps<'/hello/[name]#banner'>) {
  const data = usePreloadedQuery(graphql`...`, queries.bannerRef);
  return (
    <div>
      {data.message}
      {props.helloMessageSuffix}
    </div>
  );
}
```

### Conditional Loading

Entrypoints can be conditionally loaded based on URL params (e.g. tab-based
navigation):

```tsx
export const getPreloadProps: GetPreloadProps<'/commander/[commander]'> = ({
  variables,
  queries,
  entryPoints,
}) => ({
  queries: {shell: queries.shell({commander: variables.commander})},
  entryPoints: {
    entries:
      variables.tab === 'entries'
        ? entryPoints.entries({commander: variables.commander})
        : undefined,
    staples:
      variables.tab === 'staples'
        ? entryPoints.staples({commander: variables.commander})
        : undefined,
  },
});
```

## Architecture

### Code Generation System (`packages/pastoria/src/generate.ts`)

`pastoria generate` uses **ts-morph** to statically analyze TypeScript source
files in the user's `pastoria/` directory and generates artifacts in
`__generated__/router/`:

1. **`PastoriaMetadata`** (`metadata.ts`) scans `pastoria/**` and classifies:
   - `page.tsx` with a default export → route entrypoints
   - Other `.tsx` files → resources (nested entrypoints)
   - `route.ts` files → server API routes
   - Reserved files (`app.tsx`, `environment.ts`) excluded

2. **`PastoriaExecutionContext`** (`generate.ts`) generates:
   - **`router.tsx`** — route config, navigation hooks, `Link`/`RouteLink`
     components
   - **`js_resource.ts`** — module registry mapping IDs to dynamic `import()`
     calls
   - **`server.ts`** — imports/mounts all `route.ts` Express handlers
   - **`<name>.entrypoint.ts`** (one per resource) — Relay entrypoint objects
     with `getPreloadProps`, query refs, and schema
   - **`types.ts`** — global `PastoriaPageProps<R>` type augmentations

3. **Per-entrypoint generation** reads:
   - `Queries` type → query names and refs
   - `EntryPoints` type → nested entrypoint references
   - `schema` export or auto-generates Zod schema from query variables
   - `getPreloadProps` export or auto-generates one wiring all query variables

4. **Checksum system** (`fs.ts`): Generated files are Prettier-formatted and
   stamped with SHA-256 checksums. Re-runs skip files with unchanged checksums.

Templates for generation are in `packages/pastoria/templates/`.

### Build System

**Pastoria CLI Commands** (`packages/pastoria/src/index.ts`):

- `pastoria dev`: Start Vite in middleware mode, run codegen on start, watch for
  changes, reload server entry via `vite.ssrLoadModule()` per request
- `pastoria generate`: Run code generation once
- `pastoria build`: Run client build then server build sequentially

**Vite Plugin** (`vite_plugin.ts`):

The `createBuildConfig()` function configures both builds with:

- Tailwind via `@tailwindcss/vite`
- React with Relay babel plugin and React Compiler
- CJS interop for `react-relay` packages
- `pastoria-runtime` bundled with SSR (`noExternal`)
- Asset manifests for production preloading

Two virtual modules are provided:

- **`virtual:pastoria-entry-client.tsx`** — imports `createRouterApp` from
  generated router, hydrates React app
- **`virtual:pastoria-entry-server.tsx`** — exports `createHandler()` that
  mounts the router handler + API routes on Express

In watch mode, the plugin watches `pastoria/**/*.tsx` changes and re-runs code
generation automatically.

### Relay Integration (`packages/pastoria-runtime`)

- **Client environment** (`src/relay_client_environment.ts`): Singleton that
  POSTs to `/api/graphql` with either query text or a `pastoria-id` extension
  for persisted queries
- **Server environment** (`src/server/relay_server_environment.ts`): Per-request
  environment that executes queries directly against the schema (no HTTP)
- **Persisted queries**: Relay compiles queries into
  `__generated__/router/persisted_queries.json` (query ID → query text). The
  server GraphQL handler resolves queries by ID.

### SSR Preloading Flow

**Server-side:**

1. Router matches the URL path using `radix3`
2. `loadEntryPoint()` calls the entrypoint's `getPreloadProps(params)`
3. All queries fire in parallel against the server GraphQL environment
4. Query results are serialized into `window.__router_ops`
5. React renders to a pipeable stream with hydration bootstrapping
6. Vite manifest is walked to inject `<link rel="modulepreload">` and stylesheet
   `preinit` calls

**Client-side:**

1. `router__hydrateStore()` commits all `__router_ops` into the Relay store
2. `router__loadEntryPoint()` calls `loadEntryPoint()` — Relay finds data
   already in store, no network fetch needed
3. React hydrates from the SSR HTML

### Production Server (`packages/pastoria-server`)

Standalone Express server that:

1. Reads `dist/client/.vite/manifest.json` for asset fingerprinting
2. Dynamically imports the compiled server entry
3. Calls `createHandler(persistedQueries, manifest)`
4. Serves static files from `dist/client`
5. Listens on port 8000

### Key Configuration

- Uses pnpm workspace catalog for shared dependency versions
  (`pnpm-workspace.yaml`)
- TypeScript compilation outputs to `dist/` in each package
- All packages are ESM (`"type": "module"`)
- `pastoria` package has a bin entry for the CLI
- Development requires building packages first since CLI references compiled
  code

## Common Patterns in Pastoria Apps

### GraphQL Schema

Pastoria requires a `GraphQLSchema` but is agnostic about how it's built. The
examples and edhtop16 use [grats](https://grats.capt.dev/) for schema-from-JSDoc
development, but any schema construction approach works (e.g. `graphql-js`
directly, Nexus, Pothos, SDL-first, etc.).

### Pagination

Lists use `usePaginationFragment` with `@connection` and `@refetchable`:

```tsx
const {data, loadNext, hasNext} = usePaginationFragment(
  graphql`
    fragment page_commanders on Query
    @argumentDefinitions(
      cursor: {type: "String"}
      count: {type: "Int", defaultValue: 48}
    )
    @refetchable(queryName: "CommandersPaginationQuery") {
      commanders(first: $count, after: $cursor)
        @connection(key: "page__commanders") {
        edges {
          node {
            id
            ...CommanderCard
          }
        }
      }
    }
  `,
  data,
);
```

### Filter Changes via URL

Sort/filter state lives in the URL. Changes use `replaceRoute` to update params,
which re-triggers `getPreloadProps` and loads new data:

```tsx
const {replaceRoute} = useNavigation();
replaceRoute('/', {sortBy: value, timePeriod});
```

### Tab-Based Navigation with Conditional Entrypoints

Tabs are modeled as URL params. `getPreloadProps` conditionally loads the
relevant nested entrypoint, and the page renders it inside `<Suspense>`:

```tsx
{
  entryPoints.entries && (
    <Suspense fallback={<Loading />}>
      <EntryPointContainer
        entryPointReference={entryPoints.entries}
        props={{}}
      />
    </Suspense>
  );
}
```

## Development Notes

- Always build packages before testing CLI functionality: `pnpm -r build`
- **Always format code before creating a PR**: `pnpm format`
  - CI will fail if code is not formatted with Prettier
  - Run `pnpm check:format` to verify formatting without making changes
- The framework has no test suite currently (package.json scripts show no test
  command)
- When modifying templates (`packages/pastoria/templates/`), the changes affect
  code generation for user projects
- Entry point generation uses static imports (not dynamic) - the code is
  generated differently based on file existence
- Client and server builds must coordinate on serialization format for Relay
  operations
- Reference apps: `examples/starter` (minimal), `examples/nested_entrypoints`
  (sub-components), and the external `edhtop16` project (production app)
