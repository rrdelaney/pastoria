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

### Build System (`packages/pastoria/src/build.ts`)

The framework uses Vite with custom virtual entry points:

**Client Build** (`dist/client/` in user projects):

- Entry: Virtual module `virtual:pastoria-entry-client.tsx`
- Conditionally includes static import of app root from generated `app_root.ts`
  (checked at build time)
- Hydrates React app with router and optional app wrapper

**Server Build** (`dist/server/` in user projects):

- Entry: Virtual module `virtual:pastoria-entry-server.tsx`
- Conditionally includes static import of app root from generated `app_root.ts`
  (checked at build time)
- Exports `createHandler()` which sets up Express routes, GraphQL endpoint, and
  SSR

The `createBuildConfig()` function configures both builds with:

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
  `__generated__/persisted_queries.json` in user projects

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

### Framework User Project Conventions

User projects are expected to have:

- Component with `@appRoot` JSDoc tag: Optional root app wrapper component
  (replaces hardcoded `src/pages/_app.tsx`)
- `src/lib/server/context.ts`: GraphQL context factory
- `__generated__/schema/schema.ts`: GraphQL schema (from Relay compiler)
- `__generated__/persisted_queries.json`: Persisted query map (from Relay
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
- The framework has no test suite currently (package.json scripts show no test
  command)
- When modifying templates (`packages/pastoria/templates/`), the changes affect
  code generation for user projects
- The virtual module system in `build.ts` generates entry points at build time
  by checking for `app_root.ts` existence
- Entry point generation uses static imports (not dynamic) - the code is
  generated differently based on file existence
- Client and server builds must coordinate on serialization format for Relay
  operations
