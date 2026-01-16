---
sidebar_position: 1
---

# Creating Your GraphQL Schema

Pastoria lets you bring your own GraphQL schema. You can use any schema library
that produces a standard `GraphQLSchema` object, such as Grats, Pothos, Nexus,
or plain graphql-js.

## Quick Overview

Your GraphQL schema is configured in `pastoria/environment.ts`:

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

Pastoria uses this schema to:

1. Create a GraphQL API endpoint at `/api/graphql`
2. Execute queries during server-side rendering
3. Validate queries at build time via Relay compiler

## Using Grats (Recommended)

[Grats](https://grats.capt.dev) lets you define your GraphQL schema using
TypeScript code with JSDoc annotations—no separate schema files needed.

### Setup

```bash
pnpm add grats
```

### Defining Query Fields

Use `@gqlQueryField` to expose a function as a GraphQL query:

```ts
// src/schema/hello.ts
import {Context} from './context';

/**
 * A simple hello world query.
 *
 * @gqlQueryField
 */
export function hello(ctx: Context): string {
  return 'Hello from Pastoria!';
}

/**
 * Greets a user by name.
 *
 * @gqlQueryField
 */
export function greet(name: string, ctx: Context): string {
  return `Hello, ${name}!`;
}
```

This generates:

```graphql
type Query {
  hello: String!
  greet(name: String!): String!
}
```

### Defining Types

Use `@gqlType` on a class to create a GraphQL object type:

```ts
// src/schema/types/city.ts

/** @gqlType */
class City {
  constructor(
    /** @gqlField */
    readonly name: string,
    /** @gqlField */
    readonly population: number,
  ) {}
}

/**
 * @gqlQueryField
 */
export function cities(query?: string | null): City[] {
  return CITIES.filter((c) => !query || c.name.includes(query)).map(
    (c) => new City(c.name, c.population),
  );
}
```

### Building the Schema

```ts
// src/schema/index.ts
import {buildSchemaSync} from 'grats';

export function getSchema() {
  return buildSchemaSync({
    // Import all your schema files
    emitSchemaFile: '__generated__/schema/schema.graphql',
  });
}
```

For complete Grats documentation, visit
[grats.capt.dev](https://grats.capt.dev).

## Using Pothos

[Pothos](https://pothos-graphql.dev) is a code-first GraphQL schema builder with
excellent TypeScript support.

### Setup

```bash
pnpm add @pothos/core
```

### Example

```ts
// src/schema/builder.ts
import SchemaBuilder from '@pothos/core';
import {Context} from './context';

export const builder = new SchemaBuilder<{
  Context: Context;
}>({});

builder.queryType({
  fields: (t) => ({
    hello: t.string({
      resolve: () => 'Hello from Pastoria!',
    }),
    greet: t.string({
      args: {
        name: t.arg.string({required: true}),
      },
      resolve: (_, {name}) => `Hello, ${name}!`,
    }),
  }),
});

// src/schema/index.ts
import {builder} from './builder';
import './types/user'; // Import type definitions

export function getSchema() {
  return builder.toSchema();
}
```

For complete Pothos documentation, visit
[pothos-graphql.dev](https://pothos-graphql.dev).

## Using graphql-js Directly

You can also build schemas with plain graphql-js:

```ts
// src/schema/index.ts
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

export function getSchema() {
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        hello: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: () => 'Hello from Pastoria!',
        },
        greet: {
          type: new GraphQLNonNull(GraphQLString),
          args: {
            name: {type: new GraphQLNonNull(GraphQLString)},
          },
          resolve: (_, {name}) => `Hello, ${name}!`,
        },
      },
    }),
  });
}
```

## Context

The context object is passed to all resolvers and is created for each request:

```ts
// src/schema/context.ts
import type {User} from '../types';

export class Context {
  user: User | null;

  constructor(opts: {user?: User | null} = {}) {
    this.user = opts.user ?? null;
  }

  requireUser(): User {
    if (!this.user) {
      throw new Error('Authentication required');
    }
    return this.user;
  }
}
```

Configure context creation in `environment.ts`:

```tsx
// pastoria/environment.ts
export default new PastoriaEnvironment({
  schema: getSchema(),
  createContext: async (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = token ? await verifyToken(token) : null;
    return new Context({user});
  },
});
```

## Type Mapping Reference

Common TypeScript to GraphQL type mappings:

| TypeScript           | GraphQL        |
| -------------------- | -------------- |
| `string`             | `String!`      |
| `number`             | `Float!`       |
| `boolean`            | `Boolean!`     |
| `string \| null`     | `String`       |
| `string?` (optional) | `String`       |
| `string[]`           | `[String!]!`   |
| `(string \| null)[]` | `[String]!`    |
| Custom class         | Object type    |
| `Promise<T>`         | `T` (resolved) |

## Schema Output

For debugging and tooling, output your schema as SDL:

```ts
import {printSchema} from 'graphql';
import {getSchema} from './schema';

const sdl = printSchema(getSchema());
console.log(sdl);
```

Or write it to a file for GraphQL tooling:

```ts
import {writeFileSync} from 'fs';
import {printSchema} from 'graphql';

writeFileSync('schema.graphql', printSchema(getSchema()));
```

## Relay Compiler Integration

Relay compiler needs your schema to validate queries. Configure it in
`relay.config.json`:

```json
{
  "src": "./",
  "schema": "./__generated__/schema/schema.graphql",
  "language": "typescript",
  "artifactDirectory": "./__generated__/queries",
  "eagerEsModules": true,
  "persistConfig": {
    "file": "./__generated__/router/persisted_queries.json"
  }
}
```

Make sure your schema is output to a file that Relay can read.

## Next Steps

- Learn how to [write GraphQL queries](./graphql-queries.md) in your components
- Configure your [environment](../routing/environment-config.md) for GraphQL
- Understand [pages](../routing/pages.md) and the query preloading pattern
