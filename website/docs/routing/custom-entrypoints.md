---
sidebar_position: 4
---

# Custom Entry Points

Custom entry points (`entrypoint.ts` files) give you full control over how a
route's data is preloaded. Use them when you need to transform URL parameters,
conditionally load nested entry points, or implement complex preloading logic.

## When to Use Custom Entry Points

Most routes work fine with the default behavior—route and search parameters are
automatically passed to GraphQL queries. Use a custom `entrypoint.ts` when you
need to:

- **Transform parameters** before passing to queries (e.g., decode URLs, parse
  IDs)
- **Conditionally load** optional nested entry points based on parameters
- **Compute query variables** from multiple parameters
- **Validate parameters** with custom Zod schemas

## Basic Structure

A custom entry point file has two exports:

```tsx
// pastoria/posts/[id]/entrypoint.ts
import type {EntryPointParams} from '#genfiles/router/router.jsx';
import type {PreloadPropsForRoute} from '#genfiles/router/types';
import * as z from 'zod/v4-mini';

// 1. Schema for parameter validation
export const schema = z.object({
  id: z.string(),
});

// 2. Function that returns preload configuration
export default function getPreloadProps({
  params,
  queries,
  entryPoints,
}: EntryPointParams<'/posts/[id]'>): PreloadPropsForRoute<'/posts/[id]'> {
  return {
    queries: {
      postQuery: queries.postQuery({id: params.id}),
    },
    entryPoints: {},
  };
}
```

### `schema` Export

The `schema` export defines how URL parameters are validated and transformed:

```tsx
export const schema = z.object({
  // Route parameter (required)
  id: z.string(),

  // URL-encoded parameter (transform)
  name: z.pipe(z.string(), z.transform(decodeURIComponent)),

  // Optional search parameter (nullish allows undefined from URL)
  page: z.pipe(
    z.nullish(z.coerce.number()),
    z.transform((n) => n ?? undefined),
  ),

  // Nullable with default
  sort: z.pipe(
    z.nullish(z.string()),
    z.transform((s) => s ?? 'date'),
  ),
});
```

Pastoria uses [Zod v4-mini](https://zod.dev) for schema validation, which has a
slightly different API from standard Zod (using `z.pipe()` for transforms). The
schema is applied to the merged route and search parameters before
`getPreloadProps` is called.

### `getPreloadProps` Function

The default export is a function that receives:

- **`params`** - Validated parameters (typed according to your schema)
- **`queries`** - Helper functions to create query preload configs
- **`entryPoints`** - Helper functions to create entry point preload configs

It returns an object with `queries` and `entryPoints` to preload.

## Parameter Transformation

Transform parameters before they reach your queries:

```tsx
// pastoria/users/[name]/entrypoint.ts
import * as z from 'zod/v4-mini';

export const schema = z.object({
  // Decode URL-encoded name
  name: z.pipe(z.string(), z.transform(decodeURIComponent)),

  // Convert string to number
  page: z.pipe(z.string(), z.transform(Number)),

  // Parse JSON from search param
  filters: z.pipe(
    z.string().optional(),
    z.transform((s) => (s ? JSON.parse(s) : {})),
  ),
});

export default function getPreloadProps({params, queries}) {
  return {
    queries: {
      userQuery: queries.userQuery({
        name: params.name, // Already decoded
        page: params.page, // Already a number
      }),
    },
    entryPoints: {},
  };
}
```

## Conditional Entry Point Loading

The primary use case for custom entry points is conditionally loading optional
nested entry points:

```tsx
// pastoria/hello/[name]/entrypoint.ts
import type {EntryPointParams} from '#genfiles/router/router.jsx';
import type {PreloadPropsForRoute} from '#genfiles/router/types';
import * as z from 'zod/v4-mini';

export const schema = z.object({
  name: z.pipe(z.string(), z.transform(decodeURIComponent)),
  showBanner: z.nullish(z.coerce.boolean()),
});

export default function getPreloadProps({
  params,
  queries,
  entryPoints,
}: EntryPointParams<'/hello/[name]'>): PreloadPropsForRoute<'/hello/[name]'> {
  // Conditionally load the optional banner
  const shouldShowBanner =
    params.showBanner || params.name.toLowerCase() === 'ryan';

  return {
    queries: {
      nameQuery: queries.nameQuery({name: params.name}),
    },
    entryPoints: {
      // Return undefined to skip loading this optional entry point
      banner: shouldShowBanner ? entryPoints.banner({}) : undefined,

      // Required entry points must always be returned
      results: entryPoints.results({q: params.name}),
    },
  };
}
```

**Important:** Only optional entry points (defined with `(name).page.tsx`) can
return `undefined`. Required entry points must always be returned.

## Query Variable Computation

Compute query variables from multiple parameters:

```tsx
// pastoria/search/entrypoint.ts
import * as z from 'zod/v4-mini';

export const schema = z.object({
  q: z.nullish(z.string()),
  category: z.nullish(z.string()),
  minPrice: z.nullish(z.coerce.number()),
  maxPrice: z.nullish(z.coerce.number()),
});

export default function getPreloadProps({params, queries, entryPoints}) {
  // Build filters object from multiple params
  const filters = {
    category: params.category,
    priceRange:
      params.minPrice || params.maxPrice
        ? {min: params.minPrice, max: params.maxPrice}
        : undefined,
  };

  return {
    queries: {
      searchQuery: queries.searchQuery({
        query: params.q || '',
        filters: JSON.stringify(filters),
      }),
    },
    entryPoints: {
      // Pass computed variables to nested entry point
      results: entryPoints.results({query: params.q, filters}),
    },
  };
}
```

## Type Safety

The `EntryPointParams` and `PreloadPropsForRoute` types provide full type
safety:

```tsx
import type {EntryPointParams} from '#genfiles/router/router.jsx';
import type {PreloadPropsForRoute} from '#genfiles/router/types';

export default function getPreloadProps({
  params,
  queries,
  entryPoints,
}: EntryPointParams<'/posts/[id]'>): PreloadPropsForRoute<'/posts/[id]'> {
  // params is typed based on your schema
  // queries has methods matching your page's queries export
  // entryPoints has methods for each nested entry point

  return {
    queries: {
      // TypeScript ensures you call the right query with correct variables
      postQuery: queries.postQuery({id: params.id}),
    },
    entryPoints: {
      // TypeScript knows which entry points exist and their variable types
    },
  };
}
```

### `EntryPointParams<Route>`

Provides types for the function parameters:

- `params` - Typed according to your Zod schema inference
- `queries` - Object with helper functions for each query in your page's
  `queries` export
- `entryPoints` - Object with helper functions for each nested entry point

### `PreloadPropsForRoute<Route>`

Ensures your return value has the correct structure:

- `queries` - Must include all queries from your page's `queries` export
- `entryPoints` - Must include all required entry points, optional ones can be
  `undefined`

## File Organization

Custom entry point files must be colocated with their `page.tsx`:

```
pastoria/posts/[id]/
├── page.tsx          # Required: the page component
├── entrypoint.ts     # Optional: custom preload logic
├── sidebar.page.tsx  # Optional: nested entry point
└── (related).page.tsx  # Optional: optional nested entry point
```

Rules:

1. `entrypoint.ts` must have a colocated `page.tsx`
2. Nested entry points (`*.page.tsx`) cannot have their own `entrypoint.ts`
3. Only one `entrypoint.ts` per route directory

## Complete Example

Here's a full example showing all features:

```tsx
// pastoria/products/[category]/[id]/entrypoint.ts
import type {EntryPointParams} from '#genfiles/router/router.jsx';
import type {PreloadPropsForRoute} from '#genfiles/router/types';
import * as z from 'zod/v4-mini';

export const schema = z.object({
  // Route parameters
  category: z.pipe(z.string(), z.transform(decodeURIComponent)),
  id: z.string(),

  // Search parameters
  showReviews: z.nullish(z.coerce.boolean()),
  compareWith: z.nullish(z.string()),
});

export default function getPreloadProps({
  params,
  queries,
  entryPoints,
}: EntryPointParams<'/products/[category]/[id]'>): PreloadPropsForRoute<'/products/[category]/[id]'> {
  return {
    queries: {
      // Transform category and pass to query
      productQuery: queries.productQuery({
        category: params.category.toLowerCase(),
        id: params.id,
      }),
    },
    entryPoints: {
      // Always load related products
      related: entryPoints.related({category: params.category}),

      // Conditionally load reviews (optional entry point)
      reviews: params.showReviews
        ? entryPoints.reviews({productId: params.id})
        : undefined,

      // Conditionally load comparison (optional entry point)
      comparison: params.compareWith
        ? entryPoints.comparison({
            productId: params.id,
            compareWith: params.compareWith,
          })
        : undefined,
    },
  };
}
```

## Migration from Default Behavior

If you start with a simple page and later need custom logic, add an
`entrypoint.ts` that matches the default behavior first:

```tsx
// Default behavior equivalent
export const schema = z.object({
  id: z.string(),
});

export default function getPreloadProps({params, queries, entryPoints}) {
  return {
    queries: {
      postQuery: queries.postQuery(params), // Pass all params
    },
    entryPoints: {
      // Include all entry points with empty params
      sidebar: entryPoints.sidebar({}),
    },
  };
}
```

Then customize as needed.

## Best Practices

### Keep Schemas Simple

Define only the parameters you actually use:

```tsx
// Good - only what's needed
export const schema = z.object({
  id: z.string(),
});

// Avoid - unnecessary complexity
export const schema = z.object({
  id: z.string(),
  unused1: z.string().optional(),
  unused2: z.number().optional(),
});
```

### Use Type-Safe Helpers

Always use the provided `queries` and `entryPoints` helpers instead of
constructing objects manually:

```tsx
// Good - type-safe
queries.postQuery({id: params.id});

// Avoid - manual construction loses type safety
{
  parameters: PostQueryParameters,
  variables: {id: params.id},
}
```

### Document Complex Logic

If your preloading logic is complex, add comments explaining the business rules:

```tsx
export default function getPreloadProps({params, queries, entryPoints}) {
  // Premium users see personalized recommendations
  // Free users see generic popular items
  const isPremium = params.tier === 'premium';

  return {
    queries: {...},
    entryPoints: {
      recommendations: isPremium
        ? entryPoints.recommendations({userId: params.userId})
        : entryPoints.recommendations({type: 'popular'}),
    },
  };
}
```

## Next Steps

- Learn about the [root layout](./root-layout.md) for application-wide wrappers
- Explore [API routes](./api-routes.md) for backend endpoints
- Understand [GraphQL queries](../graphql/graphql-queries.md) in depth
