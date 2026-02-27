# Pastoria

A full-stack JavaScript framework for building scalable, data-driven apps with
React and Relay.

**[Documentation](https://pastoria.org)** |
**[GitHub](https://github.com/rrdelaney/pastoria)**

## Overview

Pastoria is a React meta-framework with an emphasis on type-correctness and data
interactivity. It combines file-based routing, React Relay for GraphQL data
fetching, Vite for build tooling, server-side rendering, and TailwindCSS — all
wired together with automatic code generation.

Pastoria doesn't support React server components or server functions. These
features are often redundant and overstep Relay's data management. Instead,
Pastoria uses Relay to dynamically load and render React components, with
bundles created using Vite.

## Features

- **File-based routing** with type-safe navigation and Zod param validation
- **React Relay** integration with persisted queries and entrypoint-based
  preloading
- **Server-side rendering** with automatic hydration
- **Code generation** that wires routes, queries, and entrypoints together
- **Nested entrypoints** for code-splitting and lazy-loaded sub-components
- **Vite** for fast dev server and optimized production builds
- **TailwindCSS** for styling out of the box

## Quick Start

Scaffold a new project with `create-pastoria`:

```bash
npm create pastoria my-app
cd my-app
pnpm install
pnpm generate
pnpm dev
```

## Project Structure

A Pastoria app has this layout:

```
my-app/
  pastoria/                     # Framework source directory
    app.tsx                     # App shell (wraps all pages)
    environment.ts              # PastoriaEnvironment config
    globals.css                 # Global styles
    page.tsx                    # Route: /
    about/page.tsx              # Route: /about
    hello/[name]/page.tsx       # Route: /hello/[name]
    api/greet/[name]/route.ts   # API route: /api/greet/:name
  src/                          # Shared app code
  __generated__/                # Generated code (never hand-edit)
```

Routes are defined by `page.tsx` files under `pastoria/`. Dynamic segments use
`[param]` notation. API routes use `route.ts` files and are mounted as Express
handlers.

## Packages

| Package                                         | Description                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| [`pastoria`](packages/pastoria)                 | CLI tool — `generate`, `dev`, and `build` commands                     |
| [`pastoria-runtime`](packages/pastoria-runtime) | Runtime utilities for routing, Relay environments, and server handlers |
| [`pastoria-server`](packages/pastoria-server)   | Standalone production server                                           |
| [`create-pastoria`](packages/create-pastoria)   | Scaffolding tool for new projects                                      |

## Claude Code Skill

Pastoria ships with a built-in
[Claude Code skill](packages/pastoria/templates/SKILL.md) that teaches Claude
how to create and modify pages, routes, nested entrypoints, and Relay queries in
your app. The skill is automatically available in Pastoria projects and covers
routing conventions, page exports, query patterns, and code generation — so you
can use Claude Code to scaffold and iterate on your app with full framework
awareness.

## Documentation

Full documentation is available at **[pastoria.org](https://pastoria.org)**,
covering routing, GraphQL integration, nested entrypoints, SSR architecture,
deployment, and CLI usage.

## Development

This is a pnpm workspace monorepo. To work on the framework itself:

```bash
# Build framework packages
pnpm run --filter './packages/*' build

# Type check
pnpm check:types

# Format code
pnpm format
```

## License

MIT
