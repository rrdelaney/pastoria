---
sidebar_position: 2
---

# Writing GraphQL Queries

Pastoria uses [React Relay](https://relay.dev) for GraphQL data fetching. Relay
provides automatic query optimization, persisted queries, and seamless
server-side rendering integration.

## Quick Overview

In Pastoria apps, you write GraphQL queries using the `graphql` template literal
tag and consume them with `usePreloadedQuery`. Queries are preloaded on the
server before rendering, eliminating loading states on initial page load.

**Example:**

```tsx
// pastoria/posts/[id]/page.tsx
import {graphql, usePreloadedQuery} from 'react-relay';
import postQuery from '#genfiles/queries/page_PostQuery.graphql';
import type {PageProps} from '#genfiles/router/types';

export const queries = {
  postQuery: postQuery,
};

export default function PostPage({queries}: PageProps<'/posts/[id]'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_PostQuery($id: ID!) @preloadable {
        post(id: $id) {
          title
          content
        }
      }
    `,
    queries.postQuery,
  );

  return (
    <article>
      <h1>{data.post.title}</h1>
      <div>{data.post.content}</div>
    </article>
  );
}
```

## The Queries Export Pattern

Pages in Pastoria export a `queries` object to define which GraphQL queries to
preload:

```tsx
import postQuery from '#genfiles/queries/page_PostQuery.graphql';

export const queries = {
  postQuery: postQuery,
};
```

**Key points:**

1. Import the generated query object from `#genfiles/queries/`
2. Export a `queries` object with named properties
3. The property name (e.g., `postQuery`) is how you access it in the component

## Writing Queries

### Basic Query

```tsx
const data = usePreloadedQuery(
  graphql`
    query page_PostsQuery @preloadable {
      posts {
        id
        title
      }
    }
  `,
  queries.postsQuery,
);
```

### Query with Variables

```tsx
const data = usePreloadedQuery(
  graphql`
    query page_PostQuery($id: ID!) @preloadable {
      post(id: $id) {
        title
        content
      }
    }
  `,
  queries.postQuery,
);
```

Route parameters are automatically passed as variables. For `/posts/[id]`, the
`id` route parameter becomes the `$id` query variable.

### Required Directives

**`@preloadable`** - Required for all queries used in pages. Tells Relay the
query can be preloaded:

```graphql
query page_PostQuery($id: ID!) @preloadable {
  post(id: $id) {
    title
  }
}
```

**`@throwOnFieldError`** - Recommended. Throws errors if any field fails instead
of silently returning null:

```graphql
query page_PostQuery($id: ID!) @preloadable @throwOnFieldError {
  post(id: $id) {
    title
    content
  }
}
```

## Query Naming Convention

Query names should follow this pattern:

```
<filename>_<Purpose>Query
```

Examples:

- `page_PostsQuery` - For a page listing posts
- `page_UserProfileQuery` - For a user profile page
- `results_SearchResultsQuery` - For a search results nested entry point

The filename prefix helps organize queries and avoid naming conflicts.

## Using usePreloadedQuery

Always use `usePreloadedQuery` for queries defined in the `queries` export:

```tsx
export default function PostPage({queries}: PageProps<'/posts/[id]'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_PostQuery($id: ID!) @preloadable {
        post(id: $id) {
          title
        }
      }
    `,
    queries.postQuery, // Preloaded query reference
  );

  return <h1>{data.post.title}</h1>;
}
```

**Why `usePreloadedQuery`?**

- Data is already fetched on the server before rendering
- No loading states needed for initial render
- Optimal Core Web Vitals
- Works seamlessly with SSR and hydration

**Don't use `useLazyLoadQuery`** in page components—it fetches data on the
client and defeats server-side rendering benefits.

## Variable Mapping

Route parameters and search parameters are automatically mapped to query
variables:

| Source           | Example URL           | Variable    |
| ---------------- | --------------------- | ----------- |
| Route parameter  | `/posts/123`          | `$id: 123`  |
| Search parameter | `/search?q=hello`     | `$q: hello` |
| Multiple         | `/posts/123?sort=new` | Both mapped |

Variable names must match between your route path and GraphQL query:

```
Route: /posts/[id]
Query: query page_PostQuery($id: ID!)
       ↑ Must match ↑
```

## Multiple Queries

A page can preload multiple queries:

```tsx
import userQuery from '#genfiles/queries/page_DashboardUserQuery.graphql';
import statsQuery from '#genfiles/queries/page_DashboardStatsQuery.graphql';

export const queries = {
  userQuery: userQuery,
  statsQuery: statsQuery,
};

export default function DashboardPage({queries}: PageProps<'/dashboard'>) {
  const userData = usePreloadedQuery(
    graphql`
      query page_DashboardUserQuery @preloadable {
        me {
          name
        }
      }
    `,
    queries.userQuery,
  );

  const statsData = usePreloadedQuery(
    graphql`
      query page_DashboardStatsQuery @preloadable {
        stats {
          totalPosts
        }
      }
    `,
    queries.statsQuery,
  );

  return (
    <div>
      <h1>Welcome, {userData.me.name}</h1>
      <p>Total posts: {statsData.stats.totalPosts}</p>
    </div>
  );
}
```

All queries are preloaded in parallel on the server.

## Nested Entry Point Queries

Nested entry points define their own queries using the same pattern:

```tsx
// pastoria/search/results.page.tsx
import resultsQuery from '#genfiles/queries/results_SearchResultsQuery.graphql';
import type {PageProps} from '#genfiles/router/types';

export const queries = {
  resultsQuery: resultsQuery,
};

export default function SearchResults({queries}: PageProps<'/search#results'>) {
  const data = usePreloadedQuery(
    graphql`
      query results_SearchResultsQuery($q: String) @preloadable {
        search(query: $q) {
          id
          title
        }
      }
    `,
    queries.resultsQuery,
  );

  return (
    <ul>
      {data.search.map((result) => (
        <li key={result.id}>{result.title}</li>
      ))}
    </ul>
  );
}
```

Note the `PageProps` route includes `#results` for nested entry points.

## Fragments

Use fragments to co-locate data requirements with components:

```tsx
// components/PostCard.tsx
import {graphql, useFragment} from 'react-relay';
import type {PostCard_post$key} from '#genfiles/queries/PostCard_post.graphql';

const PostCardFragment = graphql`
  fragment PostCard_post on Post {
    id
    title
    excerpt
  }
`;

export function PostCard({post}: {post: PostCard_post$key}) {
  const data = useFragment(PostCardFragment, post);
  return (
    <article>
      <h2>{data.title}</h2>
      <p>{data.excerpt}</p>
    </article>
  );
}
```

Use the fragment in a page query:

```tsx
// pastoria/posts/page.tsx
export const queries = {
  postsQuery: postsQuery,
};

export default function PostsPage({queries}: PageProps<'/posts'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_PostsQuery @preloadable {
        posts {
          id
          ...PostCard_post
        }
      }
    `,
    queries.postsQuery,
  );

  return (
    <div>
      {data.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

## Optional Variables

Use nullable types for optional variables:

```graphql
query page_SearchQuery($q: String, $limit: Int) @preloadable {
  search(query: $q, limit: $limit) {
    id
    title
  }
}
```

Optional route/search parameters map to nullable query variables automatically.

## Type Safety

Relay generates TypeScript types for every query. Import and use them:

```tsx
import type {page_PostQuery} from '#genfiles/queries/page_PostQuery.graphql';

// The query response is fully typed
const data = usePreloadedQuery<page_PostQuery>(query, queries.postQuery);
data.post.title; // TypeScript knows this is string | null
```

## Compiling Queries

After writing queries, compile them with the Relay compiler:

```bash
relay-compiler
```

This:

1. Scans your codebase for `graphql` template literals
2. Validates queries against your GraphQL schema
3. Generates TypeScript types for query results
4. Creates persisted query IDs for production

Run this before `pastoria generate`:

```bash
relay-compiler && pastoria generate
```

## Persisted Queries

Pastoria automatically uses
[persisted queries](https://relay.dev/docs/guides/persisted-queries/):

- Reduces bandwidth by sending query IDs instead of full query text
- Improves security by only allowing known queries
- Enables query allowlisting in production

Configure in `relay.config.json`:

```json
{
  "persistConfig": {
    "file": "./__generated__/router/persisted_queries.json"
  }
}
```

## Common Patterns

### Conditional Data

```tsx
const data = usePreloadedQuery(
  graphql`
    query page_PostQuery($id: ID!) @preloadable {
      post(id: $id) {
        title
        author {
          name
        }
      }
    }
  `,
  queries.postQuery,
);

// Handle potentially null data
if (!data.post) {
  return <NotFound />;
}

return <h1>{data.post.title}</h1>;
```

### Lists with Keys

```tsx
const data = usePreloadedQuery(query, queries.postsQuery);

return (
  <ul>
    {data.posts.map((post) => (
      <li key={post.id}>{post.title}</li>
    ))}
  </ul>
);
```

### Nested Objects

```graphql
query page_PostQuery($id: ID!) @preloadable {
  post(id: $id) {
    title
    author {
      name
      avatar
    }
    comments {
      id
      text
      author {
        name
      }
    }
  }
}
```

## Learning More

This covers Pastoria's query patterns. For advanced Relay features:

- [Fragments](https://relay.dev/docs/guided-tour/rendering/fragments/)
- [Mutations](https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/)
- [Subscriptions](https://relay.dev/docs/guided-tour/updating-data/graphql-subscriptions/)
- [Pagination](https://relay.dev/docs/guided-tour/list-data/pagination/)
- [Optimistic Updates](https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/#optimistic-updates)

Visit the official [Relay documentation](https://relay.dev/docs).

## Next Steps

- Learn about [filesystem-based routing](../routing/filesystem-routing.md)
- Understand [page components](../routing/pages.md)
- Explore [nested entry points](../routing/nested-entrypoints.md)
