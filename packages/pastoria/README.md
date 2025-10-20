# Pastoria CLI
`pastoria` is the command-line interface that orchestrates every stage of a Pastoria application's lifecycle. It wires the shared configuration defined by `pastoria-config` into the generator, dev server, and production build steps so that the runtime (`pastoria-runtime`) and deployment target (`pastoria-server`) observe a consistent contract.

## Responsibilities
- **Artifact generation.** Parses your TypeScript source for Pastoria JSDoc annotations to emit router manifests, resource loaders, GraphQL context shims, and other files under `__generated__/` that the runtime consumes.
- **Development tooling.** Boots the Vite-based dev server with the Pastoria middleware stack, watches for schema or routing changes, and hot-reloads generated artifacts when relevant source modules update.
- **Production assembly.** Builds the client bundle, server bundle, and persisted GraphQL queries expected by `pastoria-server`, ensuring the generated assets line up with the configuration shipped in your deployable artifact.

## Core commands
- `pastoria gen` runs the artifact pipeline without starting a server. Use this in CI or whenever you need to refresh generated code after refactors.
- `pastoria dev` starts the integrated development server. Pass `--port` to override the default port while retaining code generation and schema watching.
- `pastoria build` produces optimized client and server bundles alongside persisted queries, ready to hand off to `pastoria-server` for hosting.

Further CLI documentation, environment variables, and workflow guidance are available at [pastoria.org](https://pastoria.org).
