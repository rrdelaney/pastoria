# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Pastoria is a full-stack JavaScript framework for building data-driven
applications. This repository contains only the framework itself - not an
application built with it. The framework combines:

- **Type-safe routing** with JSDoc annotations
- **React Relay** for GraphQL data fetching with persisted queries
- **Vite** for build tooling and dev server
- **Server-side rendering (SSR)** with React
- **TailwindCSS** for styling

## Monorepo Structure

This is a pnpm workspace monorepo with the following packages:

- **`packages/pastoria`**: Main CLI tool that provides `gen`, `dev`, and `build`
  commands for framework users
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

### Code Generation System (`packages/pastoria/src/generate.ts`)

The `pastoria gen` command scans TypeScript files for JSDoc annotations to
generate type-safe routing and resource loading code for framework users:

- **`@route <route-name>`**: Marks a function/component as a route handler
- **`@param <name> <type>`**: Documents route parameters (generates Zod schemas
  for validation)
- **`@resource <resource-name>`**: Marks exports for lazy loading
- **`@appRoot`**: Designates a component as the application root wrapper

Generated files (in user projects) are placed in `__generated__/router/`:

- `js_resource.ts`: Resource configuration for lazy loading
- `router.tsx`: Client-side router with type-safe routes
- `app_root.ts`: Re-export of app root component (only generated if `@appRoot`
  tag is found)

Templates for generation are in `packages/pastoria/templates/`.

### Build System

The framework uses a combination of `just` (task runner) for build orchestration
and Pastoria CLI commands for code generation and Vite builds.

**Build Pipeline** (orchestrated by `packages/pastoria/justfile`):

1. **Grats** (`just grats`): Generates GraphQL schema from JSDoc annotations
2. **Relay** (`just relay`): Compiles Relay queries with persisted queries
   (depends on Grats schema)
3. **Router** (`just router`): Runs `pastoria gen` to generate type-safe router
   artifacts (depends on Relay output for query variables)
4. **Client/Server** (`just build`): Runs `pastoria build client` and
   `pastoria build server` (depends on generated router)

**Pastoria CLI Commands**:

- `pastoria dev`: Start development server with HMR
- `pastoria gen`: Generate router artifacts (runs both exports and artifacts
  generation)
- `pastoria build <target>`: Build client or server bundle with Vite

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

### User Project Build Setup

User projects using Pastoria need to:

1. **Install `just`** (command runner):

   ```bash
   # macOS
   brew install just

   # Linux
   cargo install just

   # Windows
   scoop install just
   ```

2. **Create `justfile`** in project root:

   ```justfile
   import './node_modules/pastoria/justfile'
   ```

3. **Run build commands** via `just`:
   - `just grats` - Generate GraphQL schema
   - `just relay` - Compile Relay queries
   - `just router` - Generate router artifacts
   - `just build` - Full production build (client + server)
   - `just dev` or `pastoria dev` - Start dev server

### Framework User Project Conventions

User projects are expected to have:

- Component with `@appRoot` JSDoc tag: Optional root app wrapper component
  (replaces hardcoded `src/pages/_app.tsx`)
- `src/lib/server/context.ts`: GraphQL context factory
- `__generated__/schema/schema.ts`: GraphQL schema (from Relay compiler)
- `__generated__/router/persisted_queries.json`: Persisted query map (from Relay
  compiler)
- Route components with JSDoc annotations (`@route`, `@param`)
- Resource exports with JSDoc annotation (`@resource`)

### Key Configuration

- Uses pnpm workspace catalog for shared dependency versions
  (`pnpm-workspace.yaml`)
- TypeScript compilation outputs to `dist/` in each package
- All packages are ESM (`"type": "module"`)
- `pastoria` package has a bin entry for the CLI
- Development requires building packages first since CLI references compiled
  code

## Development Notes

- Always build packages before testing CLI functionality: `pnpm -r build`
- **Always format code before creating a PR**: `pnpm format`
  - CI will fail if code is not formatted with Prettier
  - Run `pnpm check:format` to verify formatting without making changes
- The framework has no test suite currently (package.json scripts show no test
  command)
- When modifying templates (`packages/pastoria/templates/`), the changes affect
  code generation for user projects
- When modifying the justfile (`packages/pastoria/justfile`), test changes in a
  user project by importing it
- The virtual module system in `vite_plugin.ts` generates entry points at build
  time by checking for `app_root.ts` existence
- Entry point generation uses static imports (not dynamic) - the code is
  generated differently based on file existence
- Client and server builds must coordinate on serialization format for Relay
  operations
- Build orchestration is handled by `just` - no smart incremental builds, all
  steps run on each invocation
