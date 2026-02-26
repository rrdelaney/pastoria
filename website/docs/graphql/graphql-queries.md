---
sidebar_position: 2
---

# Writing GraphQL Queries

Pastoria uses [React Relay](https://relay.dev) for GraphQL data fetching.
Queries are preloaded on the server before rendering, eliminating loading states
on initial page load.

## Quick overview

```tsx
import {page_HelloQuery} from '#genfiles/queries/page_HelloQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  hello: page_HelloQuery;
};

export default function HelloPage({
  queries,
}: PastoriaPageProps<'/hello/[name]'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query page_HelloQuery($name: String!) @preloadable @throwOnFieldError {
        greet(name: $name)
      }
    `,
    queries.hello,
  );

  return <div>{greet}</div>;
}
```

## Writing queries

Queries are defined using the `graphql` template literal:

```tsx
const data = usePreloadedQuery(
  graphql`
    query page_UserQuery($id: ID!) @preloadable @throwOnFieldError {
      user(id: $id) {
        name
        email
      }
    }
  `,
  queries.user,
);
```

Key parts:

- **Query name**: must be unique across your app (e.g. `page_UserQuery`)
- **Variables**: declared with `$` prefix and typed (e.g. `$id: ID!`)
- **`@preloadable`**: required for all entrypoint queries
- **`@throwOnFieldError`**: throws errors if any field fails (recommended)

## Using `usePreloadedQuery`

Always use `usePreloadedQuery` to consume queries preloaded by your entrypoint:

```tsx
export type Queries = {
  user: page_UserQuery;
};

export default function UserPage({queries}: PastoriaPageProps<'/users/[id]'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_UserQuery($id: ID!) @preloadable {
        user(id: $id) {
          name
          email
        }
      }
    `,
    queries.user,
  );

  return <div>{data.user.name}</div>;
}
```

**Do not use `useLazyLoadQuery`** — it fetches data on the client and defeats
the purpose of server-side rendering.

## Query naming conventions

Follow this convention for query names:

- **Pattern**: `<filename>_<QueryPurpose>Query`
- **Examples**:
  - `page_HelloQuery` — in `page.tsx`
  - `banner_HelloBannerQuery` — in `banner.tsx`
  - `results_SearchResultsQuery` — in `results.tsx`

## Query variables from URL params

When you declare a `Queries` type, Pastoria auto-maps URL params to query
variables by matching names. For a page at `pastoria/hello/[name]/page.tsx`:

```tsx
export type Queries = {
  hello: page_HelloQuery; // has variable $name: String!
};

// Pastoria auto-generates getPreloadProps that passes
// the URL param `name` to the query variable `$name`
```

For more control, export a custom `getPreloadProps` — see
[Pages](../routing/pages.md#custom-getpreloadprops).

## Relay directives

### `@preloadable`

**Required** for all queries used in entrypoints. Tells Relay to generate
`$parameters` files used for server-side preloading:

```graphql
query page_UserQuery($id: ID!) @preloadable {
  user(id: $id) {
    name
  }
}
```

### `@throwOnFieldError`

Throws an error if any field in the query fails. Recommended for catching data
issues early:

```graphql
query page_UserQuery($id: ID!) @preloadable @throwOnFieldError {
  user(id: $id) {
    name
  }
}
```

Without this directive, field errors are silently ignored and return `null`.

## Type safety

Relay generates TypeScript types for every query. Import and use them in the
`Queries` type export:

```tsx
import {page_UserQuery} from '#genfiles/queries/page_UserQuery.graphql.js';

export type Queries = {
  user: page_UserQuery;
};
```

The data returned from `usePreloadedQuery` is fully typed.

## Compiling queries

After writing queries, run the generate pipeline:

```bash
pnpm generate
```

This runs `relay-compiler` which:

1. Scans your codebase for `graphql` template literals
2. Validates queries against your GraphQL schema
3. Generates TypeScript types in `__generated__/queries/`
4. Creates persisted query IDs in `__generated__/router/persisted_queries.json`

## Persisted queries

Pastoria automatically uses persisted queries in production:

- Reduces bandwidth by sending query IDs instead of full query text
- Improves security by only allowing known queries
- Configured in `relay.config.json`:

```json
{
  "persistConfig": {
    "file": "./__generated__/router/persisted_queries.json"
  }
}
```

## Fragments

Use Relay fragments to colocate data requirements with components:

```tsx
import {useFragment, graphql} from 'react-relay';

function UserCard(props: {user: UserCard_user$key}) {
  const user = useFragment(
    graphql`
      fragment UserCard_user on User {
        id
        name
        avatar
      }
    `,
    props.user,
  );

  return <div>{user.name}</div>;
}
```

## Pagination

Use `usePaginationFragment` with `@connection` and `@refetchable` for lists:

```tsx
const {data, loadNext, hasNext} = usePaginationFragment(
  graphql`
    fragment page_items on Query
    @argumentDefinitions(
      cursor: {type: "String"}
      count: {type: "Int", defaultValue: 20}
    )
    @refetchable(queryName: "ItemsPaginationQuery") {
      items(first: $count, after: $cursor) @connection(key: "page__items") {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `,
  data,
);
```

## Learning more

For complete Relay documentation on fragments, mutations, subscriptions,
optimistic updates, and more, visit [relay.dev](https://relay.dev/docs).
