# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Pastoria is a full-stack JavaScript framework for building data-driven
applications. This repository contains only the framework itself - not an
application built with it. The framework combines:

- **Filesystem-based routing** under the `pastoria/` directory
- **React Relay** for GraphQL data fetching with persisted queries
- **Vite** for build tooling and dev server
- **Server-side rendering (SSR)** with React
- **TailwindCSS** for styling

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
- **`website`**: Docusaurus documentation site

## Common Commands

### Building the Framework

```bash
# Build all packages in parallel
pnpm -r --parallel build

# Build specific package
pnpm --filter pastoria build

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

### Documentation Website

```bash
# Start docs dev server
pnpm --filter website start

# Build docs
pnpm --filter website build
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

## Architecture

### Filesystem-Based Routing

Pastoria v2 uses filesystem-based routing under the `pastoria/` directory.
Routes are defined by the file structure:

- `pastoria/page.tsx` → `/`
- `pastoria/about/page.tsx` → `/about`
- `pastoria/post/[slug]/page.tsx` → `/post/:slug`

### Code Generation System (`packages/pastoria/src/generate.ts`)

The `pastoria generate` command scans the `pastoria/` directory to generate
type-safe routing and resource loading code:

**Input files (in user's `pastoria/` directory):**

- `page.tsx`: Page components with optional `queries` export
- `*.page.tsx`: Nested entry points (e.g., `sidebar.page.tsx`)
- `app.tsx`: Optional root layout component
- `environment.ts`: Custom `PastoriaEnvironment` configuration

**Generated files (in `__generated__/router/`):**

- `router.tsx`: Client-side router with type-safe routes and entry points
- `js_resource.ts`: Resource configuration for lazy loading
- `types.ts`: `PageProps<Route>` and `PageQueryMap` type definitions
- `app_root.ts`: Re-export of app root component (if `app.tsx` exists)

**Key generation logic:**

1. `scanFilesystemRoutes()`: Walks `pastoria/` directory to discover pages,
   nested entry points, and their queries
2. `generateRouter()`: Creates entry point functions with `getPreloadProps` that
   wire up queries and nested entry points
3. `generateJsResource()`: Creates lazy-loadable resource definitions for each
   page component
4. `generateTypes()`: Creates `PageQueryMap` interface and `PageProps<R>` type
   helper

Templates for generation are in `packages/pastoria/templates/`.

### Page Component Conventions

Pages export a default React component and optionally a `queries` object:

```tsx
// pastoria/posts/page.tsx
import {graphql, usePreloadedQuery} from 'react-relay';
import type {PageProps} from '#genfiles/router/types';
import type {page_PostsQuery} from '#genfiles/queries/page_PostsQuery.graphql';

export const queries = {
  postsQuery: {} as page_PostsQuery,
};

export default function Posts({queries}: PageProps<'/posts'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_PostsQuery {
        posts {
          id
          title
        }
      }
    `,
    queries.postsQuery,
  );
  // ...
}
```

### Nested Entry Points

Nested entry points are defined by `*.page.tsx` files in the same directory as a
`page.tsx`. They appear as preloaded entry points in the parent's props:

```
pastoria/
  page.tsx           # Main page, receives entryPoints.sidebar
  sidebar.page.tsx   # Nested entry point
```

The parent page renders nested entry points via `EntryPointContainer`:

```tsx
export default function Layout({entryPoints}: PageProps<'/'>) {
  return (
    <Suspense fallback="Loading...">
      <EntryPointContainer
        entryPointReference={entryPoints.sidebar}
        props={{}}
      />
    </Suspense>
  );
}
```

### Pastoria CLI Commands

- `pastoria generate`: Generate router artifacts from `pastoria/` directory
- `pastoria dev`: Start development server with HMR
- `pastoria build`: Build client and server bundles for production

### Build System

**Vite Builds** (via `pastoria build`):

- **Client Build** (`dist/client/`): Virtual module
  `virtual:pastoria-entry-client.tsx`, conditionally includes app root, hydrates
  React app
- **Server Build** (`dist/server/`): Virtual module
  `virtual:pastoria-entry-server.tsx`, exports `createHandler()` for Express
  routes, GraphQL, and SSR

The `createBuildConfig()` function (in `vite_plugin.ts`) configures both builds
with:

- Tailwind via `@tailwindcss/vite`
- React with Relay babel plugin
- CJS interop for `react-relay` packages
- `pastoria-runtime` bundled with SSR (`noExternal`)

### Relay Integration (`packages/pastoria-runtime`)

The runtime provides Relay environment setup for framework users:

- **Client environment** (`src/relay_client_environment.ts`): Sends queries to
  `/api/graphql`
- **Server environment** (`src/server/relay_server_environment.ts`): Executes
  queries directly against schema
- **Persisted queries**: Framework expects
  `__generated__/router/persisted_queries.json` in user projects

### Server-Side Rendering (`packages/pastoria-runtime/src/server/router_handler.tsx`)

The `createRouterHandler()` function provides the core server logic for
framework users:

1. Route matching using generated route configuration
2. Loading route entry points and preloading Relay queries
3. Rendering React to a pipeable stream
4. Injecting serialized Relay operations for client hydration
5. Serving the GraphQL API at `/api/graphql`

### Dev Server (`packages/pastoria/src/devserver.ts`)

The `pastoria dev` command:

- Starts Vite in middleware mode for HMR
- Loads server entry via `vite.ssrLoadModule()` for live updates
- Serves both static assets and SSR routes
- Reads persisted queries JSON on each request

### User Project Setup

User projects using Pastoria typically have this structure:

```
my-app/
  pastoria/
    app.tsx              # Optional root layout
    environment.ts       # PastoriaEnvironment config (schema + context)
    page.tsx             # Home page (/)
    about/
      page.tsx           # About page (/about)
    post/
      [slug]/
        page.tsx         # Dynamic route (/post/:slug)
  __generated/
    router/              # Generated by `pastoria generate`
    queries/             # Generated by Relay compiler
    schema/              # GraphQL schema
  relay.config.json
  package.json
```

**Build commands** (typically in `package.json` scripts):

```json
{
  "scripts": {
    "generate": "relay-compiler && pastoria generate",
    "dev": "pastoria dev",
    "build": "pastoria build"
  }
}
```

### Framework User Project Conventions

User projects are expected to have:

- `pastoria/environment.ts`: Exports `PastoriaEnvironment` instance with schema
  and context factory
- `pastoria/app.tsx`: Optional root layout component wrapping all pages
- `pastoria/**/page.tsx`: Page components with optional `queries` export
- `pastoria/**/*.page.tsx`: Nested entry points
- `__generated__/router/persisted_queries.json`: Persisted query map (from Relay
  compiler)

### Key Configuration

- Uses pnpm workspace catalog for shared dependency versions
  (`pnpm-workspace.yaml`)
- TypeScript compilation outputs to `dist/` in each package
- All packages are ESM (`"type": "module"`)
- `pastoria` package has a bin entry for the CLI
- Development requires building packages first since CLI references compiled
  code

## Code Generation Guidelines

When working on code generation (`packages/pastoria/src/generate.ts` and
`packages/pastoria/templates/`):

- **NEVER use `any` in generated code unless absolutely necessary.** Generated
  code should be fully type-safe. Use `unknown` if you need a placeholder type,
  or generate proper types based on the route's queries and entry points.
- Generated types should leverage TypeScript's type inference and mapped types
  to provide accurate typing for each route.
- Template files in `packages/pastoria/templates/` are copied and modified
  during generation - keep them as type-safe as possible.

## Development Notes

- Always build packages before testing CLI functionality: `pnpm -r build`
- **Always format code before creating a PR**: `pnpm format`
  - CI will fail if code is not formatted with Prettier
  - Run `pnpm check:format` to verify formatting without making changes
- The framework has no test suite currently (package.json scripts show no test
  command)
- When modifying templates (`packages/pastoria/templates/`), the changes affect
  code generation for user projects
- The virtual module system in `vite_plugin.ts` generates entry points at build
  time by checking for `app_root.ts` existence
- Entry point generation uses static imports (not dynamic) - the code is
  generated differently based on file existence
- Client and server builds must coordinate on serialization format for Relay
  operations

## Known Issues / Future Work

### Nested Entry Points Suspend on Client

Nested entry point queries are not properly serialized during SSR, causing them
to suspend on the client after hydration.

**Root Cause:** The server's `loadQueries` function in `router_handler.tsx`
needs queries to be registered with Relay's `PreloadableQueryRegistry` to
serialize them. Queries are registered when their `.graphql.ts` files are
imported (as a side effect). However:

1. The generated `router.tsx` only imports lightweight `$parameters` files to
   keep the client bundle small
2. The full `.graphql.ts` files are imported by page components
3. On the server, only the root page component is loaded before `loadQueries`
   runs
4. Nested entry point components (and their query registrations) aren't loaded
   until rendering

**Attempted Solutions:**

- Importing `.graphql.ts` files in router.tsx works but defeats the purpose of
  keeping the router bundle lightweight
- Calling `await entryPoint.getComponent()` recursively before collecting
  queries didn't trigger the module loads as expected
- Adding a `loadModuleById` callback to explicitly load modules by their
  `rootModuleID` - needs more investigation

**Potential Fix:** Ensure all nested entry point component modules are loaded on
the server before `loadQueries` runs. This could be done by:

1. Having `router__loadEntryPoint` recursively load nested modules after calling
   Relay's `loadEntryPoint`
2. Or passing a module loader function to the server handler that can load by
   `rootModuleID`

### Manually Defined Entry Points

The PASTORIA_2.md spec describes support for manually defined `entrypoint.ts`
files as an alternative to `page.tsx` files. These offer more flexibility for
custom `getPreloadProps` logic but require more boilerplate. This feature is not
yet implemented.

See PASTORIA_2.md section "Manually Defined Entry Points" for the proposed API.

### CSS Injection in Dev Mode

Currently, the dev server hardcodes `/globals.css` as the stylesheet path in
`router_handler.tsx`. This should be improved to dynamically detect CSS files
from Vite's module graph.

### Update Documentation Site for Pastoria v2

The documentation site (`website/`) still documents the v1 JSDoc-based routing
system with `@route`, `@resource`, and `@param` tags. It needs to be updated to
reflect Pastoria v2's filesystem-based routing:

- Update routing docs to cover `pastoria/` directory conventions
- Document `page.tsx`, `*.page.tsx`, `app.tsx`, and `environment.ts` files
- Remove references to JSDoc annotations for routing (`@route`, `@resource`)
- Update code examples to use `PageProps<'/route'>` instead of
  `EntryPointComponent`
- Document the `queries` export pattern for preloading GraphQL queries
- Update the "Getting Started" guide for the new project structure
