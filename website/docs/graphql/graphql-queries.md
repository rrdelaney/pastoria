---
sidebar_position: 2
---

# Writing GraphQL queries

Pastoria uses [React Relay](https://relay.dev) for GraphQL data fetching. Relay
provides powerful features like automatic query optimization, persisted queries,
and seamless server-side rendering integration.

## Quick Overview

In Pastoria apps, you write GraphQL queries using the `graphql` template literal
tag, and consume them with `usePreloadedQuery`. Queries are preloaded on the
server before rendering, eliminating loading states on initial page load.

**Example from `examples/starter/src/hello_world.tsx`:**

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

## Writing Queries

Queries are defined using the `graphql` template literal:

```tsx
const data = usePreloadedQuery(
  graphql`
    query MyComponentQuery($userId: ID!) @preloadable @throwOnFieldError {
      user(id: $userId) {
        name
        email
      }
    }
  `,
  queries.myQuery,
);
```

**Key parts:**

- **Query name**: Must be unique across your app (e.g., `MyComponentQuery`)
- **Variables**: Declared with `$` prefix and typed (e.g., `$userId: ID!`)
- **`@preloadable`**: Required directive for entrypoint queries
- **`@throwOnFieldError`**: Throws errors if any field fails (recommended)

## Using usePreloadedQuery

In Pastoria apps, always use `usePreloadedQuery` to consume queries that were
preloaded by your entrypoint:

```tsx
export const UserProfile: EntryPointComponent<
  {userQuery: UserProfileQuery},
  {}
> = ({queries}) => {
  const data = usePreloadedQuery(
    graphql`
      query UserProfileQuery($userId: ID!) @preloadable {
        user(id: $userId) {
          name
          email
          avatar
        }
      }
    `,
    queries.userQuery, // Preloaded query reference
  );

  return <div>{data.user.name}</div>;
};
```

**Why `usePreloadedQuery`?**

- ✅ Data is already fetched on the server before rendering
- ✅ No loading states needed for initial render
- ✅ Optimal Core Web Vitals
- ✅ Works seamlessly with SSR and hydration

**Don't use `useLazyLoadQuery`** in Pastoria apps—it fetches data on the client
and defeats the purpose of server-side rendering.

## Query Structure

### Selecting Fields

Request the exact fields you need:

```graphql
query PostQuery($postId: ID!) @preloadable {
  post(id: $postId) {
    title
    content
    publishedAt
  }
}
```

### Nested Objects

Query nested objects by selecting their fields:

```graphql
query PostQuery($postId: ID!) @preloadable {
  post(id: $postId) {
    title
    author {
      name
      email
    }
  }
}
```

### Lists

Query lists and map over them in your component:

**From `examples/nested_entrypoints/src/search_results.tsx`:**

```tsx
export const SearchResults: EntryPointComponent<
  {citiesQueryRef: searchResults_SearchResultsQuery},
  {}
> = ({queries}) => {
  const {cities} = usePreloadedQuery(
    graphql`
      query searchResults_SearchResultsQuery($query: String!)
      @preloadable
      @throwOnFieldError {
        cities(query: $query) {
          name
        }
      }
    `,
    queries.citiesQueryRef,
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

### Variables

Variables let you pass dynamic values to queries:

```graphql
query UserPostsQuery($userId: ID!, $limit: Int) @preloadable {
  user(id: $userId) {
    posts(limit: $limit) {
      title
      publishedAt
    }
  }
}
```

Variables are automatically passed from your route parameters when using
resource-driven entrypoints. Pastoria analyzes your `EntryPointComponent` types
to detect queries and automatically maps route params to query variables.

## Relay Directives

### @preloadable

**Required** for all queries used in entrypoints. Tells Relay this query can be
preloaded:

```graphql
query MyQuery($id: ID!) @preloadable {
  # ...
}
```

### @throwOnFieldError

Throws an error if any field in the query fails. Recommended for catching data
issues early:

```graphql
query MyQuery($id: ID!) @preloadable @throwOnFieldError {
  # If any field fails, an error is thrown
  user(id: $id) {
    name
  }
}
```

Without this directive, field errors are silently ignored and return `null`.

## Type Safety

Relay generates TypeScript types for every query. Import and use them for type
safety:

```tsx
import {UserProfileQuery} from '#genfiles/queries/UserProfileQuery.graphql.js';

export const UserProfile: EntryPointComponent<
  {userQuery: UserProfileQuery}, // Type-safe query reference
  {}
> = ({queries}) => {
  const data = usePreloadedQuery(/* ... */, queries.userQuery);
  // `data` is fully typed!
  console.log(data.user.name); // ✅ TypeScript knows this is a string
};
```

## Compiling Queries

After writing queries, compile them with the Relay compiler:

```bash
$ pnpm generate:relay
```

This:

1. Scans your codebase for `graphql` template literals
2. Validates queries against your GraphQL schema
3. Generates TypeScript types for query results
4. Creates persisted query IDs for production

The generated files appear in `__generated__/queries/`.

## Persisted Queries

Pastoria automatically uses
[persisted queries](https://relay.dev/docs/guides/persisted-queries/), which:

- ✅ Reduce bandwidth by sending query IDs instead of full query text
- ✅ Improve security by only allowing known queries
- ✅ Enable query allowlisting in production

Persisted queries are configured in `relay.config.json`:

```json
{
  "persistConfig": {
    "file": "./__generated__/router/persisted_queries.json"
  }
}
```

The generated `persisted_queries.json` file maps query IDs to query text. No
additional configuration needed—Pastoria handles this automatically.

## Query Naming Conventions

Follow these conventions for query names:

- **Pattern**: `<componentName>_<QueryPurpose>Query`
- **Examples**:
  - `UserProfile_UserQuery`
  - `PostList_PostsQuery`
  - `searchResults_SearchResultsQuery`

This helps organize queries and avoid naming conflicts.

## Common Patterns

### Query with Route Parameters

Declare queries in your `EntryPointComponent` types to automatically pass route
params:

```tsx
/**
 * @route /posts/:postId
 * @resource m#post_page
 * @param {string} postId
 */
export const PostPage: EntryPointComponent<{postQuery: PostPageQuery}, {}> = ({
  queries,
}) => {
  const data = usePreloadedQuery(
    graphql`
      query PostPageQuery($postId: ID!) @preloadable {
        post(id: $postId) {
          title
          content
        }
      }
    `,
    queries.postQuery,
  );

  return <article>{data.post.title}</article>;
};
```

The `$postId` variable is automatically populated from the route parameter.
Pastoria detects the `postQuery` property in your types and maps the `postId`
route param to the `$postId` query variable.

### Optional Variables

Use nullable types for optional variables:

```graphql
query SearchQuery($query: String) @preloadable {
  # $query can be null/undefined
  results(query: $query) {
    title
  }
}
```

Match this with optional route params:

```tsx
/**
 * @route /search
 * @param {string?} q
 */
```

## Learning More

This is a brief overview focused on Pastoria's usage patterns. For complete
Relay documentation on:

- Fragments and data masking
- Mutations
- Subscriptions
- Pagination
- Optimistic updates
- Advanced query features

Visit the official [Relay documentation](https://relay.dev/docs).

## Next Steps

Now that you understand queries, learn how to connect them to routes using
[entrypoints](../routing/manual-entrypoints.md).
