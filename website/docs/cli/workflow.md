---
sidebar_position: 2
---

# CLI Workflow Deep Dive

Understanding what the scaffolder does makes it easier to customize the generated project
or adapt the process for your own templates. This page walks through each stage of the
`create-pastoria` workflow.

## 1. Preparing the destination

- Determines the project name from the first CLI argument (defaults to
  `my-pastoria-app`).
- Resolves the absolute path and exits early if the directory already exists to prevent
  accidental overwrites.

## 2. Cloning the starter template

- Uses [`degit`](https://github.com/Rich-Harris/degit) to copy the contents of
  `examples/starter` without bringing along Git history.
- Ensures the starter always reflects the latest changes in the Pastoria repository.

## 3. Normalizing package metadata

After the files are copied, the CLI rewrites `package.json` so the new project is ready to
publish or commit:

- Replaces internal `workspace:*` dependency ranges with the current version of the
  published `pastoria`, `pastoria-runtime`, and `pastoria-server` packages.
- Keeps the project `private` flag enabled but updates the `name` field to match the target
  directory.

## 4. Housekeeping files

To avoid noisy diffs, the scaffolder creates and updates ignore files:

- `.prettierignore` excludes generated outputs, build artifacts, dependency folders, and
  environment files.
- `.gitignore` is patched to ensure `__generated__/` and common `.env*` files stay out of
  version control.

## 5. Installing dependencies

- Runs `pnpm install` when possible for optimal workspace compatibility.
- Displays a warning and falls back to `npm install` if `pnpm` is not available.

## 6. Generating artifacts

Immediately after installation the CLI executes the starter's generation scripts so that
the project can boot without additional steps:

```bash
pnpm generate:schema
pnpm generate:relay
pnpm generate:router
```

These commands produce the GraphQL schema, Relay persisted queries, and type-safe router
artifacts inside the `__generated__/` folder. The directories are created ahead of time to
prevent tool-specific complaints about missing paths.

## 7. Final instructions

When all steps succeed the CLI prints a success message with:

- The absolute path to the scaffolded project.
- A reminder to change into the directory (`cd <project>`) and run `pnpm dev`.

If any command fails, the process stops and the error from the underlying tool is surfaced
so you can troubleshoot quickly.
