---
sidebar_position: 2
---

# pastoria make

The `pastoria make` command is the main code generation and build orchestration
tool in Pastoria. It intelligently manages all the code generation steps needed
for your application, from GraphQL schema generation to router configuration.

## Quick Overview

The `make` command provides an **incremental build system** that only
regenerates what's necessary based on file changes. This makes it fast and
efficient for development workflows while ensuring all generated code stays in
sync with your source files.

```bash
# Generate all needed artifacts (smart mode)
$ pastoria make

# Run specific build steps
$ pastoria make schema relay

# Force complete rebuild
$ pastoria make -B

# Watch mode - rebuild on file changes
$ pastoria make -w

# Production build with optimized bundles
$ pastoria make --release
```

## Command Syntax

```bash
pastoria make [steps...] [options]
```

### Arguments

- **`[steps...]`** - Optional positional arguments specifying which build steps
  to run. If omitted, the command intelligently determines which steps are
  needed based on file changes.

  Available steps:
  - `schema` - Run Grats compiler to generate GraphQL schema
  - `relay` - Run Relay compiler to generate persisted queries
  - `router` - Generate Pastoria router configuration and artifacts

  **Examples:**

  ```bash
  # Run only schema generation
  $ pastoria make schema

  # Run schema and relay steps
  $ pastoria make schema relay

  # Run all steps in order
  $ pastoria make schema relay router
  ```

### Options

- **`-B, --always-make`** - Force a complete rebuild, ignoring the cache and
  previous build snapshots. Useful when you want to ensure everything is freshly
  generated.

  ```bash
  $ pastoria make -B
  ```

- **`--release`** - Build for production. This runs all code generation steps
  and then creates optimized Vite bundles for both client and server.

  ```bash
  $ pastoria make --release
  ```

- **`-w, --watch`** - Watch mode. Keeps the process running and automatically
  rebuilds when source files change. Perfect for development workflows.

  ```bash
  $ pastoria make -w
  ```

## How It Works

The `pastoria make` command implements a sophisticated incremental build system
with four main stages:

### Build Pipeline

The build pipeline consists of these steps, executed in order:

1. **Pastoria Exports Generation** - Scans TypeScript files for JSDoc
   annotations (`@route`, `@resource`, `@appRoot`) and generates an exports
   manifest

2. **Grats Compiler** - Processes GraphQL schema annotations (`@gqlType`,
   `@gqlField`, `@gqlQueryField`, etc.) and generates the GraphQL schema in
   `__generated__/schema/schema.ts`

3. **Relay Compiler** - Analyzes GraphQL queries in your components and
   generates persisted queries in `__generated__/router/persisted_queries.json`

4. **Pastoria Artifacts** - Generates router configuration, resource loaders,
   and type-safe routing utilities in `__generated__/router/`

### Incremental Change Detection

The `make` command uses `@parcel/watcher` to track file changes and only
regenerate what's necessary:

- After each successful build, it creates a snapshot (`.pastoriainfo` file)
- On subsequent runs, it compares current files against the snapshot
- Only modified, added, or deleted files trigger rebuilds
- Dependencies between steps are automatically handled

### Intelligent Step Determination

The command uses three different modes to determine which steps to run:

#### 1. Explicit Steps Mode

When you provide step names as arguments, only those steps run:

```bash
# Only regenerate schema
$ pastoria make schema

# Regenerate schema and relay artifacts
$ pastoria make schema relay
```

#### 2. Smart Inference Mode (Default)

When no steps are specified, the command analyzes changed files to determine
what needs rebuilding:

- **Pastoria annotations changed** (`@route`, `@resource`, `@appRoot`) → Runs
  Pastoria exports and artifacts generation
- **Grats annotations changed** (`@gqlType`, `@gqlField`, etc.) → Runs Grats
  compiler, Relay compiler (since schema changed), and Pastoria artifacts
- **Relay imports changed** (`import { graphql } from 'relay-runtime'`) → Runs
  Relay compiler only
- **Files deleted** → Conservative approach: runs all steps

```bash
# Analyzes files and runs only needed steps
$ pastoria make
```

**Example scenarios:**

```ts
// Scenario 1: You modify a route parameter
/**
 * @route /users/:id
 * @param id number - User ID
 */
export function UserPage() {
  // ...
}
```

Result: Only `router` step runs (Pastoria annotations changed)

```ts
// Scenario 2: You add a new GraphQL field
/**
 * @gqlField
 */
get email(): string {
  return this.emailAddress;
}
```

Result: `schema`, `relay`, and `router` steps run (GraphQL schema changed)

#### 3. Force Rebuild Mode

Using the `-B` flag ignores all snapshots and runs every step:

```bash
$ pastoria make -B
```

This is useful when:

- You want to ensure clean, fresh builds
- You suspect the cache might be stale
- You're debugging build issues

## Watch Mode

Watch mode (`-w`) is perfect for development. It continuously monitors your
source files and automatically rebuilds when changes are detected:

```bash
$ pastoria make -w
```

**Features:**

- Keeps the process running in the foreground
- Monitors all source files for changes
- Runs only the necessary build steps when files change
- Updates the snapshot after each successful rebuild
- Cleanly exits on SIGINT (`Ctrl+C`)

**Example workflow:**

```bash
# Terminal 1: Run watch mode for code generation
$ pastoria make -w

# Terminal 2: Run dev server
$ pastoria dev

# Now edit your files - changes will automatically trigger rebuilds
```

## Production Builds

The `--release` flag builds your application for production:

```bash
$ pastoria make --release
```

This performs all code generation steps and then runs Vite builds for both
client and server bundles:

- **Client bundle** → `dist/client/` - Optimized JavaScript, CSS, and assets for
  the browser
- **Server bundle** → `dist/server/` - Server-side rendering bundle for Node.js

The bundles use virtual entry points that conditionally include your app root
component if one is defined with `@appRoot`.

## Common Workflows

### Development Workflow

```bash
# Initial setup - generate all code
$ pastoria make

# Start development with auto-regeneration
$ pastoria make -w   # Terminal 1
$ pastoria dev        # Terminal 2
```

### Adding a New Route

```bash
# 1. Create your route component with @route annotation
# 2. Run code generation
$ pastoria make

# The router step will run automatically
```

### Modifying GraphQL Schema

```bash
# 1. Update your @gqlType or @gqlField annotations
# 2. Run code generation
$ pastoria make

# Schema, relay, and router steps will run automatically
```

### Deployment Build

```bash
# Create production bundles
$ pastoria make --release

# Deploy the dist/ directory to your hosting platform
```

### Debugging Build Issues

```bash
# Force a complete rebuild to clear any caching issues
$ pastoria make -B

# Run specific steps to isolate problems
$ pastoria make schema        # Just schema
$ pastoria make relay          # Just relay
$ pastoria make router         # Just router
```

## Build Artifacts

The `make` command generates files in your project's `__generated__/` directory:

```
__generated__/
├── schema/
│   └── schema.ts                    # GraphQL schema (from Grats)
└── router/
    ├── js_resource.ts               # Resource configuration for lazy loading
    ├── router.tsx                   # Type-safe client-side router
    ├── app_root.ts                  # Re-export of @appRoot component (if defined)
    ├── context.ts                   # Re-export of GraphQL context
    └── persisted_queries.json       # Relay persisted queries map
```

**Important:** Never edit these files manually - they're overwritten on each
build.

## Build Snapshot Cache

The incremental build system stores metadata in `.pastoriainfo` at your project
root. This file:

- Tracks the state of files from the previous build
- Enables fast incremental rebuilds
- Should be added to `.gitignore` (it's project-specific)

If you encounter unexpected behavior, you can delete this file and run
`pastoria make -B` to rebuild from scratch.

## Performance Tips

1. **Use watch mode during development** - Avoids the startup overhead of
   running `make` repeatedly
2. **Run specific steps when you know what changed** - Faster than smart
   inference for very large codebases
3. **Use smart mode (default) for typical development** - Balances convenience
   and performance

## Troubleshooting

### Build seems stale after changes

Try a force rebuild:

```bash
$ pastoria make -B
```

### Watch mode not detecting changes

Ensure your files are within the project directory and not in `node_modules/`,
`dist/`, or other ignored directories.

### Specific step fails

Run steps individually to isolate the issue:

```bash
$ pastoria make schema    # Test schema generation
$ pastoria make relay      # Test relay compilation
$ pastoria make router     # Test router generation
```

### Production build fails

Ensure all code generation is complete before building:

```bash
$ pastoria make -B         # Force fresh codegen
$ pastoria make --release  # Then build for production
```

## Next Steps

- Learn about [defining routes](../routing/resources.md) with `@route`
  annotations
- Understand [GraphQL schema creation](../graphql/graphql-schema.md) with Grats
- Explore [resource-driven routing](../routing/resource-driven-entrypoints.md)
