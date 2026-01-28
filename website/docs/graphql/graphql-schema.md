---
sidebar_position: 1
---

# Creating your GraphQL schema

Pastoria apps come out of the box with [Grats](https://grats.capt.dev) to
generate GraphQL schemas. Grats lets you define your GraphQL schema using
TypeScript code with JSDoc annotations—no separate schema files needed.

## Quick Overview

With Grats, you write normal TypeScript functions and classes, then annotate
them with JSDoc tags like `@gqlType`, `@gqlField`, and `@gqlQueryField`. Grats
scans your code and generates a fully-typed GraphQL schema.

**Example from `examples/starter/src/schema/hello.ts`:**

```ts
import {Context} from './context.js';

/**
 * A simple hello world query that returns a greeting message.
 *
 * @gqlQueryField
 */
export function hello(ctx: Context): string {
  return 'Hello from Pastoria!';
}

/**
 * Example query showing how to accept arguments.
 * Try querying: { greet(name: "World") }
 *
 * @gqlQueryField
 */
export function greet(name: string, ctx: Context): string {
  return `Hello, ${name}! Welcome to Pastoria.`;
}
```

This generates a GraphQL schema with two query fields:

```graphql
type Query {
  hello: String!
  greet(name: String!): String!
}
```

## Defining Query Fields

Use `@gqlQueryField` to expose a function as a GraphQL query. The function's
parameters become GraphQL arguments, and the return type becomes the field type.

```ts
/**
 * @gqlQueryField
 */
export function greet(name: string, ctx: Context): string {
  return `Hello, ${name}!`;
}
```

**Key points:**

- The **last parameter** should always be your context (`ctx: Context`)
- All **other parameters** become GraphQL arguments
- TypeScript types are automatically mapped to GraphQL types

## Defining Types

Use `@gqlType` on a class to create a GraphQL object type, and `@gqlField` to
expose specific fields.

**Example from `examples/nested_entrypoints/src/schema/cities.ts`:**

```ts
/** @gqlType */
class City {
  constructor(
    /** @gqlField */
    readonly name: string,
  ) {}
}

/**
 * Searches for a city by name
 *
 * @gqlQueryField
 */
export function cities(query?: string | null): City[] {
  const filteredCities = !query
    ? CITY_NAMES
    : CITY_NAMES.filter((c) => c.startsWith(query));

  return filteredCities.map((c) => new City(c));
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

**Key points:**

- Classes with `@gqlType` become GraphQL object types
- Properties with `@gqlField` become GraphQL fields
- Optional parameters (`query?: string`) become nullable GraphQL arguments
- Arrays automatically map to GraphQL lists

## Context

Every Pastoria app needs a GraphQL context class. This is where you define data
available to all resolvers (like database connections, auth info, etc.).

**Example from `examples/starter/src/schema/context.ts`:**

```ts
import {PastoriaRootContext} from 'pastoria-runtime/server';

/**
 * @gqlContext
 */
export class Context extends PastoriaRootContext {}
```

Your context must:

- Extend `PastoriaRootContext` from `pastoria-runtime/server`
- Be annotated with `@gqlContext`
- Be exported from `src/lib/server/context.ts` (convention)

You can add custom properties to your context:

```ts
/**
 * @gqlContext
 */
export class Context extends PastoriaRootContext {
  get userId(): string | null {
    // Return authenticated user ID from session
    return this.req.session?.userId ?? null;
  }
}
```

## Type Mapping

Grats automatically maps TypeScript types to GraphQL types:

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

## Generating the Schema

Run this command to generate your GraphQL schema:

```bash
$ pnpm generate:schema
```

Or use the Relay compiler which includes schema generation:

```bash
$ pnpm generate:relay
```

Grats outputs the schema to `__generated__/schema/schema.ts`, which Pastoria
uses at runtime.

## Learning More

This is just a brief overview. For complete documentation on Grats features
like:

- Mutations and subscriptions
- Interfaces and unions
- Custom scalars
- Field arguments
- Descriptions and deprecations

Visit the official [Grats documentation](https://grats.capt.dev).

## Next Steps

Now that you have a GraphQL schema, learn how to
[write GraphQL queries](./graphql-queries.md) in your components using React
Relay.
