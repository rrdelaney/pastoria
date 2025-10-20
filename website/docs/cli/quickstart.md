---
sidebar_position: 1
---

# Create Pastoria CLI: Quickstart

The `create-pastoria` command scaffolds a complete Pastoria application from the official
starter template. It handles cloning the example project, installing dependencies, and
running the full code-generation pipeline so you can start coding immediately.

## Usage

```bash
npm create pastoria@latest my-pastoria-app
# or
pnpm create pastoria my-pastoria-app
```

If you omit the project name, the CLI defaults to `my-pastoria-app`. The command creates a
new directory, so make sure the target path does not already exist.

### What happens under the hood

1. **Clone the starter template** from `examples/starter` in the Pastoria repository using
   `degit`.
2. **Update dependency versions** by replacing `workspace:*` references with the latest
   published `pastoria`, `pastoria-runtime`, and `pastoria-server` releases.
3. **Write project housekeeping files**, including `.prettierignore` and updated `.gitignore`
   entries for generated artifacts and environment files.
4. **Install dependencies** with `pnpm install` when available (the CLI falls back to `npm`
   if `pnpm` is not on your PATH).
5. **Generate required artifacts** by running the starter's scripts:
   - `pnpm generate:schema`
   - `pnpm generate:relay`
   - `pnpm generate:router`

When the process succeeds you will see a success banner with the path to the new project
and reminders to `cd` into the directory and launch `pnpm dev`.

## Resulting project

The generated application mirrors the `examples/starter` project in this repository. Key
files include:

- `src/app_root.tsx` &ndash; the `@appRoot` component that wraps every page.
- `src/home.tsx` &ndash; the default `@resource` component rendered at `/`.
- `src/home.entrypoint.tsx` &ndash; an EntryPoint definition annotated with `@route /`.
- `src/schema/hello.ts` &ndash; example GraphQL query fields implemented with Grats.
- `package.json` scripts for development, builds, and code generation.

Run the development server with:

```bash
pnpm dev
```

Open `http://localhost:3000` to view the starter experience.

## Switching package managers

`create-pastoria` prefers `pnpm` because the monorepo and starter scripts are optimized
for it. If `pnpm` is not installed, the CLI prints a warning and automatically falls back to
`npm install`. You can still switch to your preferred tool afterwards&mdash;the generated
project does not lock you in to a specific package manager.
