---
sidebar_position: 2
---

# Pages

Pages are the core building blocks of Pastoria applications. Each `page.tsx`
file defines a routable component that Pastoria renders when users navigate to
that route.

## Basic Page

The simplest page is just a React component:

```tsx
// pastoria/page.tsx
export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Pastoria!</h1>
    </div>
  );
}
```

This creates a route at `/` that renders the `HomePage` component.

## Pages with GraphQL Queries

Most pages need data. Pastoria integrates with React Relay to preload GraphQL
queries on the server before rendering.

### The `queries` Export

Export a `queries` object to define which GraphQL queries to preload:

```tsx
// pastoria/posts/page.tsx
import {graphql, usePreloadedQuery} from 'react-relay';
import postsQuery from '#genfiles/queries/page_PostsQuery.graphql';
import type {PageProps} from '#genfiles/router/types';

// Define queries to preload for this page
export const queries = {
  postsQuery: postsQuery,
};

export default function PostsPage({queries}: PageProps<'/posts'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_PostsQuery @preloadable {
        posts {
          id
          title
          excerpt
        }
      }
    `,
    queries.postsQuery,
  );

  return (
    <div>
      <h1>All Posts</h1>
      {data.posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

**Key points:**

1. **Import the query object** from the generated file (e.g.,
   `page_PostsQuery.graphql`)
2. **Export `queries`** with keys matching what you'll access in the component
3. **Use `PageProps<Route>`** for type-safe props
4. **Call `usePreloadedQuery`** to access the preloaded data

### Query Naming Convention

Query names should follow this pattern: `page_<QueryPurpose>Query`

- `page_PostsQuery` - For a posts list page
- `page_UserProfileQuery` - For a user profile page
- `page_SearchResultsQuery` - For search results

The `page_` prefix keeps queries organized by their associated page file.

## Dynamic Routes with Parameters

For dynamic routes, route parameters are automatically passed to queries as
variables:

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
          author {
            name
          }
        }
      }
    `,
    queries.postQuery,
  );

  return (
    <article>
      <h1>{data.post.title}</h1>
      <p>By {data.post.author.name}</p>
      <div>{data.post.content}</div>
    </article>
  );
}
```

The `$id` query variable is automatically populated from the `[id]` route
parameter.

### How Parameter Mapping Works

By default, Pastoria:

1. Extracts route parameters from the URL (e.g., `id` from `/posts/123`)
2. Merges them with search parameters (e.g., `?q=search`)
3. Passes the combined object as GraphQL query variables

Parameter names must match between your route path and GraphQL query variables:

| Route Path                  | Query Variable | URL               | Value     |
| --------------------------- | -------------- | ----------------- | --------- |
| `/posts/[id]`               | `$id`          | `/posts/123`      | `"123"`   |
| `/users/[userId]`           | `$userId`      | `/users/456`      | `"456"`   |
| `/search` (with `?q=hello`) | `$q`           | `/search?q=hello` | `"hello"` |

## The PageProps Type

`PageProps<Route>` provides type-safe props for your page component:

```tsx
import type {PageProps} from '#genfiles/router/types';

// Basic usage
export default function Page({queries}: PageProps<'/posts'>) {
  // queries is typed based on your exported queries object
}

// With nested entry points
export default function Page({queries, entryPoints}: PageProps<'/posts/[id]'>) {
  // entryPoints contains any nested entry point references
}
```

The `Route` parameter uses the filesystem path format with brackets for dynamic
segments:

- `PageProps<'/'>` - Home page
- `PageProps<'/posts'>` - Static route
- `PageProps<'/posts/[id]'>` - Dynamic route
- `PageProps<'/users/[userId]/posts'>` - Nested dynamic route

## Multiple Queries

A page can preload multiple queries:

```tsx
// pastoria/dashboard/page.tsx
import {graphql, usePreloadedQuery} from 'react-relay';
import userQuery from '#genfiles/queries/page_DashboardUserQuery.graphql';
import statsQuery from '#genfiles/queries/page_DashboardStatsQuery.graphql';
import type {PageProps} from '#genfiles/router/types';

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
          email
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
          totalViews
        }
      }
    `,
    queries.statsQuery,
  );

  return (
    <div>
      <h1>Welcome, {userData.me.name}</h1>
      <p>You have {statsData.stats.totalPosts} posts</p>
    </div>
  );
}
```

All queries in the `queries` export are preloaded in parallel on the server.

## Pages Without Queries

Not every page needs GraphQL data. Simple pages can omit the `queries` export:

```tsx
// pastoria/about/page.tsx
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>We build amazing things with Pastoria.</p>
    </div>
  );
}
```

## Query Directives

Always include the `@preloadable` directive on queries used in pages:

```graphql
query page_PostQuery($id: ID!) @preloadable {
  post(id: $id) {
    title
  }
}
```

This directive tells Relay the query can be preloaded, which is required for
server-side rendering.

### Error Handling

Add `@throwOnFieldError` to throw errors if any field fails:

```graphql
query page_PostQuery($id: ID!) @preloadable @throwOnFieldError {
  post(id: $id) {
    title
    content
  }
}
```

Without this directive, field errors are silently ignored and return `null`.

## Best Practices

### Keep Pages Focused

Each page should have a single responsibility. If a page is getting complex,
consider:

- Breaking it into nested entry points
- Moving reusable UI into separate components
- Using Relay fragments for data co-location

### Use Meaningful Query Names

Name queries after their purpose, not their location:

```tsx
// Good
export const queries = {
  postQuery: page_PostQuery,
  authorQuery: page_AuthorQuery,
};

// Avoid
export const queries = {
  q1: page_PostQuery,
  data: page_AuthorQuery,
};
```

### Prefer usePreloadedQuery

Always use `usePreloadedQuery` for queries defined in the `queries` export.
Never use `useLazyLoadQuery` for preloaded queries—it defeats the purpose of
server-side rendering.

```tsx
// Correct - uses preloaded data
const data = usePreloadedQuery(query, queries.postQuery);

// Wrong - fetches on client
const data = useLazyLoadQuery(query, {id});
```

## Next Steps

- Learn about [nested entry points](./nested-entrypoints.md) for complex layouts
- Configure custom preloading with
  [custom entry points](./custom-entrypoints.md)
- Understand [GraphQL queries](../graphql/graphql-queries.md) in depth
