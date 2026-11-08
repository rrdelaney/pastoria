---
'@pastoria/vite': minor
---

Rewrite `pastoria generate` on the TypeScript 7 (tsgo) API and remove ts-morph.
Code generation is roughly 8-10x faster, and dev-mode regeneration reuses a
single incremental tsgo process. Nested `EntryPoints` are now read from syntax,
fixing a race where they could resolve to `any` and be dropped from generated
entrypoints. Generated files skip Prettier when unchanged; checksums change once
on the first run after upgrading.
