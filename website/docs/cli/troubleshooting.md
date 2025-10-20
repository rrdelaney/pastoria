---
sidebar_position: 3
---

# CLI Troubleshooting

Most `create-pastoria` runs finish without issues, but when something goes wrong the CLI
surfaces the error from the failing step. Use the guidance below to fix common problems and
re-run the command with confidence.

## Directory already exists

**Symptom:** The CLI exits immediately with `Error: Directory <name> already exists`.

**Fix:** Choose a different project name or remove the conflicting directory before running
the command again.

## Missing pnpm

**Symptom:** A yellow warning appears indicating that `pnpm` is not installed.

**Fix:** Install pnpm globally (`npm install -g pnpm`) for faster installs, or ignore the
warning and continue using the project with `npm`. The scaffolder automatically switches to
`npm install` so the setup completes either way.

## Code generation failures

**Symptom:** One of the `generate:schema`, `generate:relay`, or `generate:router` scripts
fails with a non-zero exit code.

**Fix:**

1. Change into the partially-created project directory.
2. Resolve the reported issue. Common causes include missing local binaries or incompatible
   Node versions.
3. Re-run the failing script manually (`pnpm generate:relay`, etc.) to verify the fix.
4. Once the scripts succeed, continue with `pnpm dev`.

## Network hiccups while cloning

**Symptom:** The degit step exits with an error about fetching the starter template.

**Fix:**

- Confirm that you have network access to GitHub.
- Re-run the command; degit does not leave partial files when cloning fails.

## Dependency installation issues

**Symptom:** The install step exits with an error such as `ERR_PNPM_FETCH_` or `npm ERR!`.

**Fix:**

- Retry once to rule out transient registry issues.
- Ensure that you have access to the npm registry and no conflicting proxies.
- Delete the partially-created directory before running the CLI again to ensure a clean
  install.
