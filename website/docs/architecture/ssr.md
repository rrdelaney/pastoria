---
sidebar_position: 1
---

# Server-Side Rendering

Pastoria renders every page on the server before sending HTML to the browser.
GraphQL queries are executed server-side so the initial page load includes all
data — no loading spinners.

## How a request is handled

When the server receives a request:

1. **Route matching** — the URL is matched against your routes using
   [radix3](https://github.com/unjs/radix3)
2. **Context creation** — `PastoriaEnvironment.createContext(req)` is called to
   build a per-request context (e.g. authenticated user, database connection)
3. **Server Relay environment** — a per-request Relay environment is created
   that executes queries directly against your GraphQL schema (no HTTP
   round-trip)
4. **Entry point loading** — the matched route's `getPreloadProps()` is called
   with the parsed URL params, returning query refs and entrypoint refs
5. **Query execution** — all queries (including nested entrypoint queries) fire
   in parallel against the schema
6. **HTML rendering** — React renders the component tree to a pipeable HTML
   stream with all data available

## Data serialization

After executing all queries, the server serializes the results into a `<script>`
tag:

```html
<script>
  window.__router_ops = [
    [operationDescriptor1, payloadData1],
    [operationDescriptor2, payloadData2],
    // ...one entry per query
  ];
</script>
```

This array contains every query result needed to render the page, including
queries from nested entrypoints.

## Client-side hydration

When the browser loads the page:

1. **Store hydration** — the client reads `window.__router_ops` and calls
   `env.commitPayload()` for each entry, populating the Relay store with
   server-fetched data
2. **Entry point loading** — the client loads the same entry point the server
   used. Because all data is already in the Relay store, **no network requests
   are made**
3. **React hydration** — `hydrateRoot()` attaches event listeners to the
   server-rendered HTML, making it interactive

The result is a fully rendered page with zero client-side data fetching on
initial load.

## Asset preloading

During SSR, Pastoria walks the Vite build manifest to inject resource hints into
the HTML:

- **`<link rel="modulepreload">`** for JavaScript modules needed by the current
  route
- **CSS `preinit()`** calls for stylesheets

This ensures the browser starts downloading assets as early as possible, before
JavaScript execution begins.

## Server vs. client environments

| Aspect            | Server                                     | Client                             |
| ----------------- | ------------------------------------------ | ---------------------------------- |
| Relay environment | Per-request, executes against schema       | Singleton, POSTs to `/api/graphql` |
| Query execution   | Direct `graphql()` call (no network)       | HTTP POST with persisted query ID  |
| Store lifetime    | Created and discarded per request          | Persists for the session           |
| Context           | Has access to Express `req` (cookies, etc) | Has access to browser cookies      |

## Development vs. production

In development (`pastoria dev`):

- Vite runs in middleware mode with hot module replacement
- The server entry is loaded fresh per request via `vite.ssrLoadModule()`
- Source maps and React Refresh are injected

In production (`pastoria-server`):

- Pre-built bundles are served from `dist/`
- The Vite manifest drives asset fingerprinting and preloading
- Persisted queries are enforced (plain text queries rejected)
- GraphiQL is disabled unless explicitly enabled

## Next steps

- Review the [configuration reference](./configuration.md) for production
  settings
- Learn about [deploying to production](../deployment/production.md)
