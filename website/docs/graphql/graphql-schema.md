---
sidebar_position: 1
---

# Creating Your GraphQL Schema

Pastoria uses [Grats](https://grats.capt.dev) to generate GraphQL schemas from
TypeScript code with JSDoc annotations. You write normal TypeScript functions
and classes, annotate them, and Grats produces the schema.

## Quick overview

```ts
import {Context} from '#src/schema/context';

/**
 * @gqlQueryField
 */
export function hello(ctx: Context): string {
  return 'Hello from Pastoria!';
}

/**
 * @gqlQueryField
 */
export function greet(name: string, ctx: Context): string {
  return `Hello, ${name}! Welcome to Pastoria.`;
}
```

This generates:

```graphql
type Query {
  hello: String!
  greet(name: String!): String!
}
```

## Defining query fields

Use `@gqlQueryField` to expose a function as a GraphQL query. Parameters become
GraphQL arguments, and the return type becomes the field type:

```ts
/**
 * @gqlQueryField
 */
export function greet(name: string, ctx: Context): string {
  return `Hello, ${name}!`;
}
```

The **last parameter** should always be your context (`ctx: Context`). All other
parameters become GraphQL arguments.

## Defining types

Use `@gqlType` on a class to create a GraphQL object type, and `@gqlField` to
expose fields:

```ts
/** @gqlType */
class City {
  constructor(
    /** @gqlField */
    readonly name: string,
  ) {}
}

/**
 * @gqlQueryField
 */
export function cities(query?: string | null): City[] {
  const filtered = !query
    ? ALL_CITIES
    : ALL_CITIES.filter((c) => c.startsWith(query));
  return filtered.map((c) => new City(c));
}
```

This generates:

```graphql
type City {
  name: String!
}

type Query {
  cities(query: String): [City!]!
}
```

## Context

Every Pastoria app needs a GraphQL context class for data available to all
resolvers:

```ts
import {PastoriaRootContext} from 'pastoria-runtime/server';

/**
 * @gqlContext
 */
export class Context extends PastoriaRootContext {}
```

Your context must extend `PastoriaRootContext` and be annotated with
`@gqlContext`. You can add custom properties:

```ts
/**
 * @gqlContext
 */
export class Context extends PastoriaRootContext {
  get userId(): string | null {
    return this.req.session?.userId ?? null;
  }
}
```

## Type mapping

Grats maps TypeScript types to GraphQL types automatically:

| TypeScript            | GraphQL      |
| --------------------- | ------------ |
| `string`              | `String!`    |
| `number`              | `Float!`     |
| `boolean`             | `Boolean!`   |
| `string \| null`      | `String`     |
| `string?` (optional)  | `String`     |
| `string[]`            | `[String!]!` |
| `(string \| null)[]?` | `[String]`   |
| Custom class          | Object type  |

## Generating the schema

Run the generate pipeline to produce the schema:

```bash
pnpm generate
```

This runs `grats` first, outputting the schema to
`__generated__/schema/schema.ts`, which Pastoria uses at runtime.

## Learning more

For complete Grats documentation on mutations, subscriptions, interfaces,
unions, custom scalars, and more, visit
[grats.capt.dev](https://grats.capt.dev).

## Next steps

Learn how to [write GraphQL queries](./graphql-queries.md) in your components
using React Relay.
