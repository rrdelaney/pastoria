---
sidebar_position: 1
---

# File-Based Routing

Pastoria uses a file-based routing system. Files in the `pastoria/` directory
automatically become routes, entrypoints, or API handlers based on their name
and location.

## Route conventions

| File pattern                       | Result                            |
| ---------------------------------- | --------------------------------- |
| `pastoria/<path>/page.tsx`         | Route at `/<path>`                |
| `pastoria/<path>/[param]/page.tsx` | Dynamic route at `/<path>/:param` |
| `pastoria/<path>/other.tsx`        | Nested entrypoint `/<path>#other` |
| `pastoria/<path>/route.ts`         | Express API handler at `/<path>`  |

### Pages

Any file named `page.tsx` under `pastoria/` becomes a navigable route. The
directory path maps to the URL:

- `pastoria/page.tsx` — route `/`
- `pastoria/about/page.tsx` — route `/about`
- `pastoria/hello/[name]/page.tsx` — route `/hello/[name]`
- `pastoria/users/[id]/posts/[postId]/page.tsx` — route
  `/users/[id]/posts/[postId]`

Dynamic segments use `[param]` notation in directory names.

### Nested entrypoints

Any other `.tsx` file under `pastoria/` (excluding `app.tsx`, `app.ts`, and
`environment.ts`) becomes a **nested entrypoint** — a lazily loaded
sub-component for code splitting. Its ID uses `#` to separate the path from the
filename:

- `pastoria/hello/[name]/banner.tsx` — entrypoint `/hello/[name]#banner`
- `pastoria/hello/[name]/results.tsx` — entrypoint `/hello/[name]#results`

See [Nested Entrypoints](./nested-entrypoints.md) for details.

### API routes

Files named `route.ts` become Express API handlers mounted at the corresponding
path:

- `pastoria/api/greet/[name]/route.ts` — Express route `/api/greet/:name`

See [API Routes](./api-routes.md) for details.

### Reserved files

These files in the `pastoria/` directory are framework configuration and are
never treated as routes or entrypoints:

- **`app.tsx`** / **`app.ts`** — the app shell component wrapping all pages
- **`environment.ts`** — the `PastoriaEnvironment` config

## App shell

`pastoria/app.tsx` is an optional file that wraps all page content. It receives
the current route's rendered output as `children`. The framework provides a
default `<html>` / `<head>` / `<body>` shell around your app component, so your
`app.tsx` typically adds global styles, metadata, and layout — not a full HTML
document:

```tsx
import type {PropsWithChildren} from 'react';
import './globals.css';

export default function AppRoot({children}: PropsWithChildren) {
  return (
    <>
      <title>My App</title>
      <main>{children}</main>
    </>
  );
}
```

React 19 hoists `<title>`, `<link>`, and `<meta>` tags to `<head>`
automatically, so you can render them anywhere in your component tree.

## Environment configuration

`pastoria/environment.ts` exports a `PastoriaEnvironment` instance that
configures the GraphQL server:

```ts
import {getSchema} from '#genfiles/schema/schema';
import {Context} from '#src/schema/context';
import {GraphQLSchema, specifiedDirectives} from 'graphql';
import {PastoriaEnvironment} from 'pastoria-runtime/server';

const schemaConfig = getSchema().toConfig();
const schema = new GraphQLSchema({
  ...schemaConfig,
  directives: [...specifiedDirectives, ...schemaConfig.directives],
});

export default new PastoriaEnvironment({
  schema,
  createContext: () => new Context(),
});
```

## Route matching

The generated router uses [radix3](https://github.com/unjs/radix3) for URL
matching. Route parameters (path params and search params) are parsed through a
Zod schema that is either:

1. **Auto-generated** from the GraphQL query variables of the page's queries
2. **Explicitly exported** as a `schema` constant from the page file

Route IDs use bracket notation as the canonical identifier (e.g.
`'/hello/[name]'`).

## Code generation

After creating or removing pages, entrypoints, or API routes, code generation
must run to update the router artifacts. In development (`pastoria dev`), this
happens automatically when `.tsx` files change. Changes to `.ts` files (like
`route.ts` API routes) require running generation manually:

```bash
pnpm generate
```

This generates artifacts in `__generated__/router/`:

- **`router.tsx`** — route config, navigation hooks, `Link`/`RouteLink`
  components
- **`js_resource.ts`** — module registry mapping IDs to dynamic `import()` calls
- **`server.ts`** — imports and mounts all `route.ts` Express handlers
- **`<name>.entrypoint.ts`** — one per page/resource with `getPreloadProps`,
  query refs, and schema
- **`types.ts`** — global `PastoriaPageProps<R>` type augmentations

## Next steps

- Learn about the [page component API](./pages.md)
- Understand [nested entrypoints](./nested-entrypoints.md) for code splitting
- Set up [client-side navigation](./navigation.md)
