---
sidebar_position: 5
---

# API Routes

Files named `route.ts` under the `pastoria/` directory become server-side
Express API handlers, mounted at the corresponding URL path.

## Basic example

```
pastoria/api/greet/[name]/route.ts  →  Express route /api/greet/:name
```

A `route.ts` file default-exports an Express router:

```ts
import express from 'express';

const router = express.Router({mergeParams: true});

router.get<'/', {name: string}>('/', (req, res) => {
  res.json({greeting: `Hello ${req.params.name}`});
});

export default router;
```

## Key points

- Use `express.Router({mergeParams: true})` to access path params from the
  parent URL.
- Dynamic segments in directory names (e.g. `[name]`) become Express path params
  (`:name`).
- Route handlers are mounted at their directory path, so define handlers
  relative to `/`.
- API routes support all Express methods (`get`, `post`, `put`, `delete`, etc.).

## Code generation

When you add or remove a `route.ts` file, run code generation so the server
entry picks it up:

```bash
pnpm generate
```

In development (`pastoria dev`), this happens automatically.
