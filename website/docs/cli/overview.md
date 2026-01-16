---
sidebar_position: 1
---

# CLI Commands

Pastoria provides a simple command-line interface for managing your
application's code generation, development server, and production builds.

## Available Commands

### `pastoria generate`

Generates router artifacts from your `pastoria/` directory.

```bash
pastoria generate
```

This command scans your filesystem routes and generates:

- `__generated__/router/router.tsx` - Client-side router configuration
- `__generated__/router/js_resource.ts` - Resource loaders for code splitting
- `__generated__/router/types.ts` - `PageProps<Route>` type definitions
- `__generated__/router/app_root.ts` - Re-export of root layout (if `app.tsx`
  exists)

**When to run:** After modifying the `pastoria/` directory structure (adding,
renaming, or removing pages and entry points).

### `pastoria dev`

Starts the development server with hot module reloading.

```bash
pastoria dev
```

Features:

- Vite-powered development with fast refresh
- Server-side rendering during development
- Automatic reloading when files change

The dev server runs at `http://localhost:5173` by default.

### `pastoria build`

Creates optimized production bundles.

```bash
pastoria build
```

This generates:

- `dist/client/` - Client-side JavaScript, CSS, and assets
- `dist/server/` - Server-side rendering bundle

### `pastoria-server`

Starts the production server (after running `pastoria build`).

```bash
pastoria-server
```

This serves your built application in production mode.

## Typical Workflow

### Development

```bash
# Generate code (run Relay first, then Pastoria)
pnpm generate    # relay-compiler && pastoria generate

# Start development server
pnpm dev         # pastoria dev
```

### Production

```bash
# Generate code and build
pnpm generate
pnpm build       # pastoria build

# Start production server
pnpm start       # pastoria-server
```

## Package Scripts

Most Pastoria projects include these npm/pnpm scripts:

```json
{
  "scripts": {
    "generate": "relay-compiler && pastoria generate",
    "dev": "pastoria dev",
    "build": "pastoria build",
    "start": "pastoria-server"
  }
}
```

## Code Generation Order

The generation step typically combines Relay compiler and Pastoria generate:

```bash
relay-compiler && pastoria generate
```

**Order matters:**

1. **Relay compiler** runs first to generate query types and persisted queries
2. **Pastoria generate** runs second to generate router artifacts that reference
   the Relay-generated files

## Generated Files

After running `pnpm generate`, you'll have:

```
__generated__/
├── router/
│   ├── router.tsx              # Router configuration
│   ├── js_resource.ts          # Resource loaders
│   ├── types.ts                # PageProps types
│   ├── app_root.ts             # Root layout re-export
│   └── persisted_queries.json  # Relay persisted queries
└── queries/
    ├── page_PostQuery.graphql.ts
    ├── page_PostQuery$parameters.ts
    └── ...                     # More Relay artifacts
```

**Important:** Never edit files in `__generated__/` manually—they're overwritten
on each generation.

## Development Tips

### Watch Mode

Run generation and dev server in separate terminals for the best experience:

```bash
# Terminal 1: Watch for changes and regenerate
pnpm generate --watch  # If using Relay watch mode

# Terminal 2: Run dev server
pnpm dev
```

Or use a single command with concurrently:

```bash
# In package.json
"dev": "concurrently \"relay-compiler --watch\" \"pastoria dev\""
```

### Debugging Build Issues

If you encounter issues:

1. **Clear generated files:**

   ```bash
   rm -rf __generated__
   pnpm generate
   ```

2. **Check for TypeScript errors:**

   ```bash
   pnpm tsc --noEmit
   ```

3. **Verify file structure:**
   ```bash
   ls -la pastoria/
   ```

### Common Issues

**"Cannot find module '#genfiles/...'**

Run `pnpm generate` to create the generated files. Make sure your
`tsconfig.json` has the correct path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "#genfiles/*": ["./__generated__/*"]
    }
  }
}
```

**"Query not found in persisted queries"**

Run `relay-compiler` to generate the persisted queries file, then run
`pastoria generate`.

**"No routes found"**

Ensure your `pastoria/` directory contains at least one `page.tsx` file.

## Next Steps

- Learn about [filesystem-based routing](../routing/filesystem-routing.md)
- Understand [page components](../routing/pages.md)
- Set up your [GraphQL schema](../graphql/graphql-schema.md)
