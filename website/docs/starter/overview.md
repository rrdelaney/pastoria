---
sidebar_position: 1
---

# Starter Project Tour

The Pastoria starter project showcases how the framework combines type-safe routing,
GraphQL, and modern React tooling. This page highlights the files you receive after running
`create-pastoria` and explains how they work together.

## Project structure

```
examples/starter/
├── __generated__/           # GraphQL schema, Relay queries, and router output
├── public/                  # Static assets served as-is
├── src/
│   ├── app_root.tsx         # Global <html> wrapper annotated with @appRoot
│   ├── globals.css          # TailwindCSS entry point
│   ├── home.tsx             # Home page React component annotated with @resource
│   ├── home.entrypoint.tsx  # EntryPoint definition annotated with @route
│   └── schema/              # GraphQL schema implemented with Grats
│       ├── context.ts       # Pastoria GraphQL context class
│       └── hello.ts         # Example query fields (hello, greet)
├── package.json             # Scripts for dev, build, and code generation
├── relay.config.json        # Relay compiler configuration
└── tsconfig.json            # TypeScript project settings
```

The generated `__generated__/` directory is managed by the code generation scripts. You do
not edit files in that folder directly.

## Development commands

The starter defines the following scripts in `package.json`:

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Runs the development server with hot reloading. |
| `pnpm build` | Produces a production build. |
| `pnpm start` | Launches the production server. |
| `pnpm generate:schema` | Runs [Grats](https://grats.capt.dev) to emit the GraphQL schema. |
| `pnpm generate:relay` | Compiles GraphQL queries with Relay. |
| `pnpm generate:router` | Generates type-safe routing helpers. |

Run `pnpm dev` to start iterating locally. Visit `http://localhost:3000` in your browser to
see the welcome page defined in `src/home.tsx`.

## Styling

TailwindCSS is preconfigured through `globals.css` and `@tailwindcss/vite`. Use the utility
classes already present in `HomePage` or install additional design systems as needed.

## Next steps

- Continue to [Routing with EntryPoints](routing-and-entrypoints.md) to add new pages.
- Explore [GraphQL data fetching](graphql.md) to extend the schema and load data.
