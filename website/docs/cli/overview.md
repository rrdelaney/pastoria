---
sidebar_position: 1
---

# CLI Commands

Pastoria provides a powerful command-line interface for managing your
application's build process, code generation, and development server. The CLI is
installed when you create a new Pastoria project and is available through your
package manager.

## Available Commands

### `pastoria make`

The main build and code generation command. This orchestrates all the necessary
code generation steps for your Pastoria application, including GraphQL schema
generation, Relay compilation, and router configuration.

**Learn more:** [pastoria make](./make.md)

### `pastoria dev`

Starts the development server with hot module reloading. This command runs your
application locally with Vite middleware for fast refresh and server-side
rendering.

```bash
$ pastoria dev
```

### `pastoria build`

_(Deprecated: Use `pastoria make --release` instead)_

Creates production builds of your application, including client and server
bundles optimized for deployment.

## Quick Start

After creating a new Pastoria project, you'll typically use these commands:

```bash
# Generate all code artifacts (schema, queries, router)
$ pastoria make

# Start development server
$ pastoria dev

# Build for production
$ pastoria make --release
```

## Package Scripts

Most Pastoria projects include these npm/pnpm scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "pastoria dev",
    "build": "pastoria make --release",
    "generate": "pastoria make"
  }
}
```

This allows you to use familiar commands like:

```bash
$ pnpm dev
$ pnpm build
$ pnpm generate
```
