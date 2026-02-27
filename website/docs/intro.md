---
sidebar_position: 1
---

# Get Started

**Pastoria is a full-stack JavaScript framework for building data-driven
applications.** It combines file-based routing, [React Relay](https://relay.dev)
for GraphQL data fetching, server-side rendering, and [Vite](https://vite.dev)
for build tooling into a cohesive developer experience.

## Creating a new project

Create a new Pastoria project with the scaffolding tool:

```bash
npm create pastoria my-app
```

The only system requirement is [Node.js](https://nodejs.org/en/download/)
version 20.0 or above.

## Project structure

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
    schema/                          # Grats-generated GraphQL schema
  package.json
  tsconfig.json
  relay.config.json
```

## Path aliases

Pastoria apps use Node.js subpath imports (configured in both `package.json`
`"imports"` and `tsconfig.json` `"paths"`). Two are required by the framework:

- `#pastoria/*` maps to `./pastoria/*`
- `#genfiles/*` maps to `./__generated__/*`

Apps conventionally also add `#src/*` maps to `./src/*` for their own code.

## Package scripts

A typical Pastoria app has these scripts in `package.json`:

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

The generate pipeline is a three-step sequence:

1. **grats** — generates a GraphQL schema from TypeScript JSDoc annotations
2. **relay-compiler** — generates Relay query artifacts and persisted queries
3. **pastoria generate** — generates the router, entrypoints, and types

## Development workflow

```bash
# Install dependencies
pnpm install

# Run code generation
pnpm generate

# Start the development server
pnpm dev
```

The dev server runs Vite in middleware mode with server-side rendering. When you
edit `.tsx` files in the `pastoria/` directory, code generation runs
automatically and the page reloads.

## Production builds

```bash
# Build for production
pnpm build

# Start the production server
pnpm start
```

The build creates optimized bundles in `dist/client/` and `dist/server/`. The
standalone `pastoria-server` serves these in production.

## Next steps

- Learn about [file-based routing](./routing/file-based-routing.md)
- Understand [page components](./routing/pages.md) and data fetching
- Create your [GraphQL schema](./graphql/graphql-schema.md)
