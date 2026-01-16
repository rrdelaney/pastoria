---
sidebar_position: 7
---

# Environment Configuration

The `environment.ts` file configures your GraphQL environment, including the
schema and context factory. Pastoria uses this to create the Relay server
environment, client environment, and GraphQL API endpoint.

## Basic Setup

Create an `environment.ts` file in your `pastoria/` directory:

```tsx
// pastoria/environment.ts
import {PastoriaEnvironment} from 'pastoria-runtime';
import {getSchema} from '../src/schema';
import {Context} from '../src/schema/context';
import type express from 'express';

export default new PastoriaEnvironment({
  schema: getSchema(),
  createContext: async (req: express.Request) => {
    return new Context();
  },
});
```

## Configuration Options

### `schema`

The GraphQL schema for your application. You can create this using any GraphQL
schema library:

```tsx
// Using Grats
import {getSchema} from 'grats';
const schema = getSchema();

// Using Pothos
import {builder} from './schema/builder';
const schema = builder.toSchema();

// Using graphql-js directly
import {buildSchema} from 'graphql';
const schema = buildSchema(`
  type Query {
    hello: String
  }
`);
```

### `createContext`

A function that creates the context object passed to GraphQL resolvers. It
receives the Express request object:

```tsx
createContext: async (req: express.Request) => {
  // Extract auth token
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Get current user
  const user = token ? await verifyToken(token) : null;

  return new Context({user});
};
```

The context is created fresh for each request and passed to all resolvers.

## What Pastoria Creates

From your environment configuration, Pastoria creates:

1. **GraphQL API** at `/api/graphql` - Handles GraphQL queries and mutations
2. **Relay Server Environment** - Used for server-side query execution during
   SSR
3. **Relay Client Environment** - Configured to call `/api/graphql` from the
   browser

## Example with Authentication

Here's a complete example with authentication:

```tsx
// pastoria/environment.ts
import {PastoriaEnvironment} from 'pastoria-runtime';
import {getSchema} from '../src/schema';
import {Context} from '../src/schema/context';
import {verifySession} from '../src/auth';
import type express from 'express';

export default new PastoriaEnvironment({
  schema: getSchema(),
  createContext: async (req: express.Request) => {
    // Get session from cookies or headers
    const session = await verifySession(req);

    return new Context({
      user: session?.user ?? null,
      session,
    });
  },
});
```

```tsx
// src/schema/context.ts
import type {User, Session} from '../types';

export class Context {
  user: User | null;
  session: Session | null;

  constructor(opts: {user?: User | null; session?: Session | null} = {}) {
    this.user = opts.user ?? null;
    this.session = opts.session ?? null;
  }

  requireUser(): User {
    if (!this.user) {
      throw new Error('Authentication required');
    }
    return this.user;
  }
}
```

## Custom GraphQL Endpoint

By default, Pastoria creates the GraphQL API at `/api/graphql`. To customize
this endpoint, create your own `route.ts`:

```tsx
// pastoria/api/graphql/route.ts
import express from 'express';
import {createHandler} from 'graphql-http/lib/use/express';
import environment from '../../environment';

const router = express.Router();

router.all(
  '/',
  createHandler({
    schema: environment.schema,
    context: async (req) => environment.createContext(req.raw),
  }),
);

export default router;
```

This gives you full control over the GraphQL endpoint configuration.

## Using with Grats

[Grats](https://grats.capt.dev) is a popular choice for creating GraphQL schemas
from TypeScript:

```tsx
// src/schema/index.ts
import {buildSchemaSync} from 'grats';
import * as Types from './types';

export function getSchema() {
  return buildSchemaSync({
    types: Types,
  });
}
```

```tsx
// pastoria/environment.ts
import {PastoriaEnvironment} from 'pastoria-runtime';
import {getSchema} from '../src/schema';
import {Context} from '../src/schema/context';

export default new PastoriaEnvironment({
  schema: getSchema(),
  createContext: async (req) => new Context(),
});
```

## Using with Pothos

[Pothos](https://pothos-graphql.dev) is another excellent schema builder:

```tsx
// src/schema/builder.ts
import SchemaBuilder from '@pothos/core';
import {Context} from './context';

export const builder = new SchemaBuilder<{Context: Context}>({});

builder.queryType({
  fields: (t) => ({
    hello: t.string({resolve: () => 'Hello!'}),
  }),
});
```

```tsx
// pastoria/environment.ts
import {PastoriaEnvironment} from 'pastoria-runtime';
import {builder} from '../src/schema/builder';
import {Context} from '../src/schema/context';

export default new PastoriaEnvironment({
  schema: builder.toSchema(),
  createContext: async (req) => new Context(),
});
```

## Context Best Practices

### Keep Context Lightweight

Create only what's needed for resolvers:

```tsx
// Good - lazy loading
createContext: async (req) => {
  return {
    getUserById: (id) => db.users.findUnique({where: {id}}),
    getCurrentUser: () => verifyToken(req.headers.authorization),
  };
};

// Avoid - eager loading everything
createContext: async (req) => {
  const user = await verifyToken(req.headers.authorization);
  const permissions = await loadPermissions(user);
  const settings = await loadSettings(user);
  // ...many more queries
  return {user, permissions, settings};
};
```

### Use DataLoader for Batching

Prevent N+1 queries with DataLoader:

```tsx
import DataLoader from 'dataloader';

createContext: async (req) => {
  return {
    userLoader: new DataLoader(async (ids) => {
      const users = await db.users.findMany({
        where: {id: {in: ids as string[]}},
      });
      return ids.map((id) => users.find((u) => u.id === id));
    }),
  };
};
```

### Type Your Context

Ensure resolvers have proper types:

```tsx
// src/schema/context.ts
export interface Context {
  user: User | null;
  userLoader: DataLoader<string, User>;
  // ... other context properties
}
```

## Environment File Location

The `environment.ts` file must be at `pastoria/environment.ts`. Pastoria imports
this file to configure the GraphQL runtime.

```
pastoria/
├── environment.ts    # Required for GraphQL
├── app.tsx
├── page.tsx
└── ...
```

## Next Steps

- Learn about [GraphQL schema creation](../graphql/graphql-schema.md)
- Understand [GraphQL queries](../graphql/graphql-queries.md) in components
- Explore [API routes](./api-routes.md) for REST endpoints
