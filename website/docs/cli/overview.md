---
sidebar_position: 1
---

# CLI Commands

Pastoria provides a command-line interface for code generation, development, and
production builds. The CLI is installed as the `pastoria` package.

## `pastoria generate`

Generates router artifacts from the files in your `pastoria/` directory. This
analyzes your TypeScript source files using static analysis and produces:

- Route configuration and navigation hooks
- Module registry for code splitting
- Relay entrypoint definitions with `getPreloadProps`
- Type-safe `PastoriaPageProps<R>` type augmentations
- Server route mounts for Express API handlers

```bash
pastoria generate
```

In most projects, `pastoria generate` is the last step of the full generate
pipeline:

```bash
grats && relay-compiler && pastoria generate
```

Or via the conventional script:

```bash
pnpm generate
```

## `pastoria dev`

Starts the development server with Vite middleware mode, server-side rendering,
and hot module replacement.

```bash
pastoria dev
pastoria dev --port 4000
```

Options:

- `--port <port>` — port the dev server listens on (default: `3000`)

When `.tsx` files in `pastoria/` change, code generation runs automatically and
the page reloads. Changes to `.ts` files (like `route.ts` API routes) require
running `pnpm generate` manually.

## `pastoria build`

Creates optimized production bundles for both client and server:

```bash
pastoria build
```

This produces:

- **`dist/client/`** — optimized JavaScript, CSS, and assets for the browser
- **`dist/server/`** — server-side rendering bundle for Node.js

## `pastoria-server`

The standalone production server (from the `pastoria-server` package). Run it
after building:

```bash
NODE_ENV=production pastoria-server
```

This serves the built application on port 8000, including static files from
`dist/client/` and server-side rendered pages from `dist/server/`.

The server loads `.env` files via [dotenv](https://github.com/motdotla/dotenv),
so you can configure environment variables there. It reads the Vite manifest
from `dist/client/.vite/manifest.json` for asset fingerprinting and persisted
queries from `__generated__/router/persisted_queries.json`.

## `pastoria add-skill`

Installs the Pastoria Claude Code skill into the current project:

```bash
pastoria add-skill
```

This copies the skill manifest to `.claude/skills/pastoria/SKILL.md`, enabling
Claude Code to understand Pastoria conventions when working in your project.

## Typical package.json scripts

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
