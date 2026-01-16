---
sidebar_position: 3
---

# Nested Entry Points

Nested entry points allow you to build complex layouts with independently-loaded
components. They enable code splitting and progressive loading, where different
parts of a page can load their own code and data separately.

## What Are Nested Entry Points?

A nested entry point is a component that:

- Lives alongside a main `page.tsx` file
- Has its own GraphQL queries that are preloaded separately
- Is rendered by the parent page using `EntryPointContainer`
- Can be code-split and lazy-loaded

This pattern is useful for:

- Sidebars that load independent data
- Search results that appear below a search form
- Dashboard widgets with separate data requirements
- Any component that benefits from independent loading

## Creating Nested Entry Points

Create a nested entry point by adding a `*.page.tsx` file in the same directory
as a `page.tsx`:

```
pastoria/search/
├── page.tsx           # Main search page
└── results.page.tsx   # Nested entry point for results
```

The nested entry point becomes available in the parent's `entryPoints` prop.

### Nested Entry Point Component

Nested entry points follow the same pattern as regular pages:

```tsx
// pastoria/search/results.page.tsx
import {graphql, usePreloadedQuery} from 'react-relay';
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
    <div>
      {data.search.map((result) => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  );
}
```

**Note:** The `PageProps` type for nested entry points uses a `#` suffix:
`PageProps<'/search#results'>` where `results` is the entry point name derived
from `results.page.tsx`.

### Parent Page

The parent page renders nested entry points using `EntryPointContainer`:

```tsx
// pastoria/search/page.tsx
import {Suspense} from 'react';
import {EntryPointContainer} from 'react-relay';
import type {PageProps} from '#genfiles/router/types';

export default function SearchPage({entryPoints}: PageProps<'/search'>) {
  return (
    <div>
      <h1>Search</h1>
      <input placeholder="Search..." />

      <Suspense fallback={<div>Loading results...</div>}>
        <EntryPointContainer
          entryPointReference={entryPoints.results}
          props={{}}
        />
      </Suspense>
    </div>
  );
}
```

**Key points:**

- Access nested entry points via `entryPoints` prop
- Wrap in `Suspense` for loading states
- The entry point name (`results`) comes from the filename (`results.page.tsx`)

## Optional vs Required Entry Points

### Required Entry Points

By default, nested entry points are always loaded:

```
pastoria/dashboard/
├── page.tsx
├── sidebar.page.tsx    # Required: always loaded
└── stats.page.tsx      # Required: always loaded
```

Both `sidebar` and `stats` will always be loaded when visiting `/dashboard`.

### Optional Entry Points

Wrap the filename in parentheses to make an entry point optional:

```
pastoria/hello/[name]/
├── page.tsx
├── (banner).page.tsx   # Optional: may not be loaded
└── results.page.tsx    # Required: always loaded
```

Optional entry points:

- Have an optional type in `PageProps` (`banner?: ...`)
- Can return `undefined` from custom `getPreloadProps`
- Should be conditionally rendered in the parent

```tsx
// pastoria/hello/[name]/page.tsx
import {Suspense} from 'react';
import {EntryPointContainer} from 'react-relay';
import type {PageProps} from '#genfiles/router/types';

export default function HelloPage({entryPoints}: PageProps<'/hello/[name]'>) {
  return (
    <div>
      {/* Optional entry point - check if it exists */}
      {entryPoints.banner && (
        <Suspense fallback="Loading banner...">
          <EntryPointContainer
            entryPointReference={entryPoints.banner}
            props={{}}
          />
        </Suspense>
      )}

      {/* Required entry point - always exists */}
      <Suspense fallback="Loading results...">
        <EntryPointContainer
          entryPointReference={entryPoints.results}
          props={{}}
        />
      </Suspense>
    </div>
  );
}
```

## Conditional Loading

Use a custom `entrypoint.ts` to conditionally load optional entry points:

```tsx
// pastoria/hello/[name]/entrypoint.ts
import type {EntryPointParams} from '#genfiles/router/router.jsx';
import type {PreloadPropsForRoute} from '#genfiles/router/types';
import * as z from 'zod/v4-mini';

export const schema = z.object({
  name: z.pipe(z.string(), z.transform(decodeURIComponent)),
});

export default function getPreloadProps({
  params,
  queries,
  entryPoints,
}: EntryPointParams<'/hello/[name]'>): PreloadPropsForRoute<'/hello/[name]'> {
  // Only show banner for specific users
  const showBanner = params.name.toLowerCase() === 'ryan';

  return {
    queries: {
      nameQuery: queries.nameQuery({name: params.name}),
    },
    entryPoints: {
      // Conditionally load the optional banner
      banner: showBanner ? entryPoints.banner({}) : undefined,
      // Always load results
      results: entryPoints.results({}),
    },
  };
}
```

See [Custom Entry Points](./custom-entrypoints.md) for more details.

## Passing Props to Entry Points

The `EntryPointContainer` `props` parameter passes runtime props to the nested
component:

```tsx
// Parent page
<EntryPointContainer
  entryPointReference={entryPoints.results}
  props={{onSelect: handleSelect, highlighted: true}}
/>
```

These props are received as the second argument to the nested component:

```tsx
// Nested entry point
export default function Results({queries}, {onSelect, highlighted}) {
  // queries from preloading, other props from parent
}
```

**Note:** The `props` parameter is for runtime props only. Data should come from
GraphQL queries, not props.

## Passing Variables to Entry Point Queries

Nested entry points can receive query variables from:

1. **Route parameters** - Automatically passed from the URL
2. **Search parameters** - Automatically merged with route params
3. **Custom entrypoint.ts** - Explicitly configure what variables to pass

For example, to pass a search query to results:

```tsx
// pastoria/search/entrypoint.ts
export const schema = z.object({
  q: z.string().optional(),
});

export default function getPreloadProps({params, queries, entryPoints}) {
  return {
    queries: {},
    entryPoints: {
      // Pass the search query to the results entry point
      results: entryPoints.results({q: params.q}),
    },
  };
}
```

## Entry Point Naming

Entry point names are derived from filenames:

| Filename                  | Entry Point Name | Optional |
| ------------------------- | ---------------- | -------- |
| `sidebar.page.tsx`        | `sidebar`        | No       |
| `search_results.page.tsx` | `search_results` | No       |
| `(banner).page.tsx`       | `banner`         | Yes      |
| `(user_info).page.tsx`    | `user_info`      | Yes      |

Use snake_case for multi-word names to match JavaScript property naming
conventions.

## Code Splitting Benefits

Nested entry points automatically enable code splitting:

1. **Parallel loading**: Parent and nested components load independently
2. **Progressive rendering**: Parent UI appears first, nested content follows
3. **Smaller bundles**: Each entry point is a separate chunk
4. **Isolated data**: Each component fetches only what it needs

This is especially valuable for:

- Large applications with many routes
- Pages with heavy components (charts, editors)
- Components that aren't needed on initial render

## Example: Dashboard Layout

Here's a complete example of a dashboard with multiple nested entry points:

```
pastoria/dashboard/
├── page.tsx              # Main layout
├── sidebar.page.tsx      # Navigation sidebar
├── stats.page.tsx        # Statistics widgets
└── (notifications).page.tsx  # Optional notifications panel
```

```tsx
// pastoria/dashboard/page.tsx
import {Suspense} from 'react';
import {EntryPointContainer} from 'react-relay';
import type {PageProps} from '#genfiles/router/types';

export default function DashboardPage({entryPoints}: PageProps<'/dashboard'>) {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Suspense fallback="Loading...">
          <EntryPointContainer
            entryPointReference={entryPoints.sidebar}
            props={{}}
          />
        </Suspense>
      </aside>

      <main className="content">
        <Suspense fallback="Loading stats...">
          <EntryPointContainer
            entryPointReference={entryPoints.stats}
            props={{}}
          />
        </Suspense>
      </main>

      {entryPoints.notifications && (
        <aside className="notifications">
          <Suspense fallback="Loading notifications...">
            <EntryPointContainer
              entryPointReference={entryPoints.notifications}
              props={{}}
            />
          </Suspense>
        </aside>
      )}
    </div>
  );
}
```

## Best Practices

### Use Suspense Boundaries

Always wrap `EntryPointContainer` in a `Suspense` boundary:

```tsx
<Suspense fallback={<Skeleton />}>
  <EntryPointContainer entryPointReference={entryPoints.sidebar} props={{}} />
</Suspense>
```

### Keep Entry Points Focused

Each nested entry point should have a single, well-defined responsibility. If an
entry point is doing too much, split it into multiple entry points.

### Consider Loading Order

Place the most important content outside of nested entry points for faster
initial render. Use nested entry points for secondary content that can load
progressively.

### Use Optional Entry Points Sparingly

Only use optional entry points when you genuinely need conditional loading based
on route parameters. For static layouts, required entry points are simpler.

## Next Steps

- Learn about [custom entry points](./custom-entrypoints.md) for advanced
  preloading logic
- Understand the [root layout](./root-layout.md) for application-wide wrappers
- Explore [GraphQL queries](../graphql/graphql-queries.md) for data fetching
