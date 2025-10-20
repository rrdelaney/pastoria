---
sidebar_position: 1
---

# Welcome to Pastoria

Pastoria is a full-stack JavaScript framework for building data-driven applications with
React, Relay, and a type-safe GraphQL layer. The framework ships with an opinionated
development workflow, automatic code generation, and a starter project that demonstrates
the core patterns you will use in production.

## Try Pastoria in minutes

The quickest way to explore Pastoria is with the `create-pastoria` command. It clones the
starter project, installs dependencies, generates GraphQL and routing artifacts, and
prepares a ready-to-run development environment.

```bash
npm create pastoria@latest my-app
# or
pnpm create pastoria my-app
```

After the scaffolder finishes, change into the new directory and start the development
server:

```bash
cd my-app
pnpm dev
```

## What you get

A new Pastoria project includes:

- **React + Relay application shell** with an `@appRoot` component (`src/app_root.tsx`).
- **Type-safe routing** generated from annotated entrypoints such as `src/home.entrypoint.tsx`.
- **GraphQL schema** defined with Grats, starting with fields in `src/schema/hello.ts`.
- **TailwindCSS styling** and an example home page component (`src/home.tsx`).

Each of these pieces is covered in depth throughout the documentation so you can extend
the starter into a production application.

## Next steps

- Follow the [Create Pastoria CLI guide](cli/quickstart.md) to understand the scaffolding
  workflow and available options.
- Dive into the [Starter project tour](starter/overview.md) to learn how the generated
  code is organized and how to add new routes, data, and styling.

## Requirements

Before you begin, install Node.js 20 or newer. The CLI prefers `pnpm`, but will fall back
to `npm` if `pnpm` is not available.
