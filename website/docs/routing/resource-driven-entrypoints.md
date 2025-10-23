---
sidebar_position: 3
---

# Resource-Driven Entrypoints

While [manual entrypoints](./manual-entrypoints.md) give you complete control,
resource-driven entrypoints provide a more concise way to define routes when you
don't need complex preloading logic. Pastoria automatically generates the
entrypoint code from JSDoc annotations on your component.

## What are Resource-Driven Entrypoints?

Resource-driven entrypoints combine the component definition and routing
configuration in a single file. Instead of creating a separate `.entrypoint.tsx`
file, you add JSDoc annotations to your component and Pastoria generates the
entrypoint automatically when you run `pastoria gen`.

**Key difference from manual entrypoints:**

- Manual: Separate files for entrypoint config and component
- Resource-driven: Single file with annotations, entrypoint auto-generated

## Prerequisites

Before working with resource-driven entrypoints, you should understand
[resources](./resources.md)—Pastoria's system for code splitting and lazy
loading. The `@resource` tag is required for resource-driven entrypoints.

## Basic Example

Here's a simple resource-driven route from
`examples/starter/src/hello_world.tsx`:

```tsx
import {helloWorld_HelloQuery} from '#genfiles/queries/helloWorld_HelloQuery.graphql.js';
import {EntryPointComponent, graphql, usePreloadedQuery} from 'react-relay';

/**
 * @route /hello/:name
 * @resource m#hello
 * @param {string} name
 */
export const HelloWorldPage: EntryPointComponent<
  {nameQuery: helloWorld_HelloQuery},
  {}
> = ({queries}) => {
  const {greet} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloQuery($name: String!)
      @preloadable
      @throwOnFieldError {
        greet(name: $name)
      }
    `,
    queries.nameQuery,
  );

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">{greet}</h1>
      </div>
    </div>
  );
};
```

**What happens when you run `pastoria gen`:**

Pastoria scans this file and generates an entrypoint equivalent to:

```tsx
// Auto-generated - do not edit manually
export const entrypoint: EntryPoint = {
  root: JSResource.fromModuleId('m#hello'),
  getPreloadProps({params, schema}) {
    const {name} = schema.parse(params);
    return {
      queries: {
        nameQuery: {
          parameters: helloWorld_HelloQueryParameters,
          variables: {name},
        },
      },
    };
  },
};
```

You get all the benefits of manual entrypoints without writing the boilerplate!

## Type-Based Query and Entrypoint Detection

Pastoria automatically detects queries and nested entrypoints by analyzing the TypeScript types in your `EntryPointComponent` declaration. You only need to properly type your component, and Pastoria handles the rest!

**How it works:**

- Pastoria examines the first type parameter (queries) of `EntryPointComponent<QueriesType, EntryPointsType>`
- For each property in `QueriesType`, it creates a preloaded query
- For each property in `EntryPointsType`, it creates a nested entrypoint reference
- Route parameters are automatically mapped to query variables by matching names

All you need is proper TypeScript types—no additional annotations required!

## JSDoc Annotations

Resource-driven entrypoints use three key annotations:

### `@route <pattern>`

Defines the URL pattern for this route.

```tsx
/**
 * @route /users/:userId/posts/:postId
 */
```

Supports:

- Static paths: `/about`, `/contact`
- Dynamic parameters: `/:userId`, `/:slug`
- Nested parameters: `/users/:userId/posts/:postId`

### `@resource <module-id>`

Marks the component as a lazy-loadable resource with a module ID. See
[resources](./resources.md) for complete details.

```tsx
/**
 * @resource m#user_profile
 */
```

**Important**: Every resource-driven route needs both `@route` and `@resource`.

### `@param {type} name`

Declares route parameters and their types.

```tsx
/**
 * @route /users/:userId
 * @param {string} userId
 */
```

**Supported types:**

- `string`: Any string value
- `number`: Numeric values (e.g., IDs)
- `boolean`: Boolean values
- Add `?` for optional: `{string?}`, `{number?}`

Pastoria generates:

- **Zod schemas** for runtime validation
- **TypeScript types** for compile-time safety
- Parsing logic in the auto-generated entrypoint

**Example with multiple parameters:**

```tsx
/**
 * @route /posts/:postId/comments/:commentId
 * @param {number} postId
 * @param {string} commentId
 */
```

## Queries

To preload GraphQL queries, simply declare them in the first type parameter of your `EntryPointComponent`:

```tsx
/**
 * @route /users/:userId
 * @resource m#user_profile
 * @param {string} userId
 */
export const UserProfilePage: EntryPointComponent<
  {userQuery: UserProfileQuery},  // ← Pastoria detects this query!
  {}
> = ({queries}) => {
  const data = usePreloadedQuery(
    graphql`
      query UserProfileQuery($userId: ID!) @preloadable {
        user(id: $userId) {
          name
          email
        }
      }
    `,
    queries.userQuery, // Preloaded with {userId} from route params
  );

  return <div>{data.user.name}</div>;
};
```

**How automatic variable mapping works:**

1. Pastoria finds the `userQuery` property in the queries type
2. It looks up the `UserProfileQuery` type to find its variables (e.g., `$userId`)
3. It matches route parameter names to query variable names
4. Route parameter `userId` → Query variable `$userId` automatically!

**Multiple queries:**

```tsx
export const DashboardPage: EntryPointComponent<
  {
    userQuery: UserQuery;
    statsQuery: StatsQuery;
    notificationsQuery: NotificationsQuery;
  },
  {}
> = ({queries}) => {
  // All three queries are preloaded automatically!
  const user = usePreloadedQuery(UserQueryDef, queries.userQuery);
  const stats = usePreloadedQuery(StatsQueryDef, queries.statsQuery);
  const notifications = usePreloadedQuery(NotificationsQueryDef, queries.notificationsQuery);

  return <div>{/* Render dashboard */}</div>;
};
```

## Nested Entrypoints

For parent-child UI patterns, declare nested entrypoints in the second type parameter:

```tsx
import {helloWorld_HelloQuery} from '#genfiles/queries/helloWorld_HelloQuery.graphql.js';
import {helloWorld_HelloCityResultsQuery} from '#genfiles/queries/helloWorld_HelloCityResultsQuery.graphql.js';
import {ModuleType} from '#genfiles/router/js_resource.js';
import {Suspense} from 'react';
import {
  EntryPoint,
  EntryPointComponent,
  EntryPointContainer,
  graphql,
  usePreloadedQuery,
} from 'react-relay';

/**
 * @route /hello/:name
 * @resource m#hello
 * @param {string} name
 * @param {string?} q
 */
export const HelloWorld: EntryPointComponent<
  {nameQuery: helloWorld_HelloQuery},
  {searchResults: EntryPoint<ModuleType<'m#hello_results'>>}  // ← Nested entrypoint!
> = ({queries, entryPoints}) => {
  const {greet} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloQuery($name: String!)
      @preloadable
      @throwOnFieldError {
        greet(name: $name)
      }
    `,
    queries.nameQuery,
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-36">
      <h1>{greet}</h1>

      <Suspense fallback="Loading...">
        <EntryPointContainer
          entryPointReference={entryPoints.searchResults}
          props={{}}
        />
      </Suspense>
    </div>
  );
};
```

The nested component is a separate resource with its own queries:

```tsx
/**
 * @resource m#hello_results
 */
export const HelloWorldCityResults: EntryPointComponent<
  {citiesQuery: helloWorld_HelloCityResultsQuery},  // ← This query is auto-detected too!
  {}
> = ({queries}) => {
  const {cities} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloCityResultsQuery($q: String)
      @preloadable
      @throwOnFieldError {
        cities(query: $q) {
          name
        }
      }
    `,
    queries.citiesQuery,
  );

  return (
    <div className="grid w-full max-w-lg grid-cols-2">
      {cities.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
};
```

**How it works:**

1. Pastoria examines the `EntryPointsType` (second type parameter)
2. It finds `searchResults: EntryPoint<ModuleType<'m#hello_results'>>`
3. It extracts the module ID `'m#hello_results'` and creates a nested entrypoint
4. The nested resource's queries are automatically preloaded based on its own `EntryPointComponent` types
5. Route parameters are passed down to nested entrypoints automatically

**Benefits:**

- **Code splitting**: Child component loads separately from parent
- **Progressive rendering**: Parent UI appears first, child loads in background
- **Isolated data requirements**: Each component manages its own queries
- **Reusability**: Nested entrypoints can be used across multiple parent routes
- **Type safety**: TypeScript ensures correct entrypoint references

**When to use nested entrypoints:**

- Parent-child UI patterns (e.g., search input + results)
- Data that depends on parent component state
- Heavy components that should load separately
- Components reused across multiple routes

## When to Use Resource-Driven Entrypoints

**Use resource-driven entrypoints when:**

- ✅ Route parameters map directly to query variables
- ✅ You don't need conditional preloading logic
- ✅ You want concise, maintainable code
- ✅ Nested entrypoints with simple type declarations

**Use manual entrypoints when:**

- ❌ You need conditional queries based on parameters
- ❌ Complex nested entrypoint logic (dynamic children, conditional loading)
- ❌ Query variables come from complex logic, not just route params
- ❌ You need different components based on runtime conditions

## Complete Example

Here's a real-world example showing all annotations:

```tsx
import {PostPageQuery} from '#genfiles/queries/PostPageQuery.graphql.js';
import {EntryPointComponent, graphql, usePreloadedQuery} from 'react-relay';
import {useRouteParams} from '#genfiles/router/router';

/**
 * @route /posts/:postId
 * @resource m#post_page
 * @param {number} postId
 */
export const PostPage: EntryPointComponent<{postQuery: PostPageQuery}, {}> = ({
  queries,
}) => {
  // Access route params if needed
  const {postId} = useRouteParams('/posts/:postId');

  // Use preloaded query
  const data = usePreloadedQuery(
    graphql`
      query PostPageQuery($postId: ID!) @preloadable @throwOnFieldError {
        post(id: $postId) {
          title
          content
          author {
            name
            avatar
          }
          comments {
            id
            text
          }
        }
      }
    `,
    queries.postQuery,
  );

  return (
    <article>
      <h1>{data.post.title}</h1>
      <div className="author">
        <img src={data.post.author.avatar} alt={data.post.author.name} />
        <span>{data.post.author.name}</span>
      </div>
      <div className="content">{data.post.content}</div>
      <div className="comments">
        {data.post.comments.map((comment) => (
          <div key={comment.id}>{comment.text}</div>
        ))}
      </div>
    </article>
  );
};
```

**What Pastoria generates:**

When you run `pastoria gen`, Pastoria:

1. Finds all `@route` + `@resource` combinations
2. Parses `@param` declarations → generates Zod schemas
3. Analyzes `EntryPointComponent` types → detects queries and nested entrypoints
4. Maps route params to query variables automatically
5. Creates type-safe entrypoint configuration

You get the same performance and SSR benefits as manual entrypoints with much
less code!

## Optional Parameters

Use `?` suffix for optional route parameters:

```tsx
/**
 * @route /search
 * @resource m#search
 * @param {string?} q
 */
export const SearchPage: EntryPointComponent<
  {searchQuery: SearchQuery},
  {}
> = ({queries}) => {
  const data = usePreloadedQuery(
    graphql`
      query SearchQuery($q: String) @preloadable {
        results(query: $q) {
          title
        }
      }
    `,
    queries.searchQuery,
  );

  return <div>{/* Render search results */}</div>;
};
```

**Route patterns with optional params:**

- `/search` (q is undefined)
- `/search?q=pastoria` (q is "pastoria")

The generated entrypoint handles optional parameters correctly, passing
`undefined` when not provided.

## Component Requirements

For resource-driven entrypoints, your component must:

1. **Be typed as `EntryPointComponent`**

```tsx
import {EntryPointComponent} from 'react-relay';

export const MyPage: EntryPointComponent<QueriesType, EntryPointsType> = ({
  queries,
  entryPoints,
}) => {
  // ...
};
```

2. **Accept queries via props**

```tsx
= ({queries}) => {
  const data = usePreloadedQuery(MyQuery, queries.myQuery);
  // ...
}
```

3. **Use `usePreloadedQuery` (not `useLazyLoadQuery`)**

```tsx
// ✅ Correct - uses preloaded data
const data = usePreloadedQuery(MyQuery, queries.myQuery);

// ❌ Wrong - fetches on client, defeats SSR benefits
const data = useLazyLoadQuery(MyQuery, variables);
```

## Code Generation Workflow

Here's the typical development workflow:

1. **Write your component with annotations and proper types:**

```tsx
/**
 * @route /users/:userId
 * @resource m#user_profile
 * @param {string} userId
 */
export const UserProfilePage: EntryPointComponent<
  {userQuery: UserProfileQuery},
  {}
> = ({queries}) => {
  // Component code
};
```

2. **Run code generation:**

```bash
$ pastoria gen
```

Pastoria generates:

- Type-safe router configuration
- Entrypoint definitions (by analyzing your component types)
- Zod schemas for parameter validation
- TypeScript types

3. **Use generated types in your component:**

```tsx
import {useRouteParams} from '#genfiles/router/router';

const {userId} = useRouteParams('/users/:userId'); // Fully typed!
```

4. **Develop with type safety:**

TypeScript will catch:

- Invalid route parameters
- Mismatched query types
- Missing required props
- Incorrect query variable types

## Summary

Resource-driven entrypoints provide:

- ✅ Concise syntax with minimal JSDoc annotations
- ✅ Automatic entrypoint generation via `pastoria gen` using TypeScript type analysis
- ✅ Same SSR and preloading benefits as manual entrypoints
- ✅ Less boilerplate for simple routes
- ✅ Type-safe parameter validation
- ✅ Automatic query variable mapping
- ✅ Type-based query and nested entrypoint detection

**When you need more control**, drop down to
[manual entrypoints](./manual-entrypoints.md) for:

- Conditional preloading logic
- Complex nested entrypoint logic
- Complex query variable computation
- Dynamic route behavior

Both patterns work together seamlessly in the same application!
