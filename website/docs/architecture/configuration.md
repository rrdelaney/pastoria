---
sidebar_position: 2
---

# Configuration Reference

Pastoria is configured through `pastoria/environment.ts`, which exports a
`PastoriaEnvironment` instance.

## PastoriaEnvironment

```ts
import {PastoriaEnvironment} from 'pastoria-runtime/server';

export default new PastoriaEnvironment({
  schema,
  createContext: (req) => new Context(req),
  enableGraphiQLInProduction: false,
  persistedQueriesOnlyInProduction: true,
});
```

### Options

| Option                             | Type                                            | Default      | Description                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`                           | `GraphQLSchema`                                 | **Required** | The GraphQL schema for both the API endpoint and server-side query execution during SSR.                                                                                                                                         |
| `createContext`                    | `(req: Request) => unknown \| Promise<unknown>` | `() => ({})` | Factory function called per request. The returned value is passed as `contextValue` to all GraphQL resolvers. Receives the Express `Request` object.                                                                             |
| `enableGraphiQLInProduction`       | `boolean`                                       | `false`      | Whether to serve the GraphiQL IDE at `/api/graphql` when `NODE_ENV=production`. Always available in development.                                                                                                                 |
| `persistedQueriesOnlyInProduction` | `boolean`                                       | `true`       | When `true`, the `/api/graphql` endpoint rejects plain-text queries in production and only accepts persisted query IDs. Prevents arbitrary query execution in production. In development, plain-text queries are always allowed. |

### `schema`

The GraphQL schema is required. Pastoria is agnostic about how you build it —
see [Creating Your GraphQL Schema](../graphql/graphql-schema.md) for options.

The schema is used in two places:

1. **`/api/graphql` endpoint** — handles GraphQL requests from the client
2. **SSR preloading** — executes queries server-side before rendering

### `createContext`

The context factory runs once per request. Use it to set up per-request state
like authenticated users, database connections, or request-scoped caches:

```ts
import type {Request} from 'express';

export class Context {
  constructor(public readonly req: Request) {}

  get userId(): string | null {
    return this.req.cookies?.userId ?? null;
  }
}

export default new PastoriaEnvironment({
  schema,
  createContext: (req) => new Context(req),
});
```

The context is passed to every GraphQL resolver as the context argument. If
using [Grats](https://grats.capt.dev), annotate the class with `@gqlContext` and
it becomes the last parameter of resolver functions.

### `enableGraphiQLInProduction`

By default, the GraphiQL IDE is only available in development. Set this to
`true` if you want to expose it in production (e.g. for internal tools or
staging environments):

```ts
export default new PastoriaEnvironment({
  schema,
  enableGraphiQLInProduction: true,
});
```

### `persistedQueriesOnlyInProduction`

Persisted queries are a security feature. The Relay compiler generates a mapping
of query IDs to query text in `__generated__/router/persisted_queries.json`. In
production, the server only accepts these known query IDs, preventing clients
from executing arbitrary GraphQL.

Disable this if you need to allow ad-hoc queries in production (e.g. from a
mobile app or third-party client):

```ts
export default new PastoriaEnvironment({
  schema,
  persistedQueriesOnlyInProduction: false,
});
```

## GraphQL API endpoint

The GraphQL endpoint is automatically mounted at `POST /api/graphql`. Client
requests include:

```json
{
  "query": "query getUser($id: ID!) { ... }",
  "variables": {"id": "123"},
  "extensions": {"pastoria-id": "abc123"}
}
```

When `persistedQueriesOnlyInProduction` is `true` (the default), the server uses
the `pastoria-id` extension to look up the query text from the persisted queries
map. The `query` field is ignored in this mode.

## Next steps

- Learn how [SSR](./ssr.md) uses these settings at runtime
- Set up your [deployment](../deployment/production.md)
