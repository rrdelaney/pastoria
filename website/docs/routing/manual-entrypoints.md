---
sidebar_position: 2
---

# Manual Entrypoints

Entrypoints are the core routing mechanism in Pastoria. They define how routes
map to components and control what data gets preloaded before rendering. Manual
entrypoints give you full control over this process.

## What is an Entrypoint?

An entrypoint is a configuration object that tells Pastoria:

1. **What component** to render for a route
2. **What data** (GraphQL queries) to preload on the server
3. **What nested entrypoints** to preload for child components

When a user navigates to a route, Pastoria:

1. Matches the URL to an entrypoint
2. Executes the entrypoint's `getPreloadProps` function on the server
3. Preloads all specified queries and nested entrypoints
4. Renders the component with preloaded data
5. Sends the fully rendered HTML to the client
6. Hydrates the React app on the client with the same preloaded data

This approach eliminates loading spinners for initial page loads and provides
optimal Core Web Vitals.

## Prerequisites

Before working with entrypoints, you should understand
[resources](./resources.md)—Pastoria's system for code splitting and lazy
loading. Resources are referenced in entrypoints using
`JSResource.fromModuleId()`.

## Manual Entrypoint Structure

A manual entrypoint is defined in a separate `.entrypoint.tsx` file and exports
an `entrypoint` constant.

### Basic Example

Here's the simplest possible entrypoint from
`examples/starter/src/home.entrypoint.tsx`:

```tsx
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/** @route / */
export const entrypoint: EntryPoint<
  ModuleType<'m#home'>,
  EntryPointParams<'/'>
> = {
  root: JSResource.fromModuleId('m#home'),
  getPreloadProps({}) {
    return {
      queries: {},
    };
  },
};
```

**Key parts:**

- `@route /`: Defines the URL pattern this entrypoint handles
- `root`: Points to the component resource to render (`m#home`)
- `getPreloadProps`: Function that returns what to preload (currently nothing)

The corresponding `home.tsx` file defines the resource:

```tsx
/**
 * @resource m#home
 */
export function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">Welcome to Pastoria!</h1>
        <p className="mt-4 text-gray-300">
          It's like the darkness in the light
        </p>
      </div>
    </div>
  );
}
```

## Preloading GraphQL Queries

The real power of entrypoints is preloading GraphQL queries on the server.

### Example with Query Preloading

```tsx
import UserProfileQueryParameters from '#genfiles/queries/UserProfileQuery$parameters';
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/**
 * @route /users/:userId
 * @param {string} userId
 */
export const entrypoint: EntryPoint<
  ModuleType<'m#user_profile'>,
  EntryPointParams<'/users/:userId'>
> = {
  root: JSResource.fromModuleId('m#user_profile'),
  getPreloadProps({params, schema}) {
    const {userId} = schema.parse(params);

    return {
      queries: {
        userQueryRef: {
          parameters: UserProfileQueryParameters,
          variables: {userId},
        },
      },
    };
  },
};
```

**Key concepts:**

- `@param {string} userId`: Declares a route parameter with its type
- `params`: Raw URL parameters passed to `getPreloadProps`
- `schema.parse(params)`: Validates and parses params using generated Zod schema
- `queries.userQueryRef`: Preloads a query and makes it available to the
  component as `queries.userQueryRef`

The corresponding component consumes the preloaded query:

```tsx
import {UserProfileQuery} from '#genfiles/queries/UserProfileQuery.graphql.js';
import {EntryPointComponent, graphql, usePreloadedQuery} from 'react-relay';

/**
 * @resource m#user_profile
 */
export const UserProfilePage: EntryPointComponent<
  {userQueryRef: UserProfileQuery},
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
    queries.userQueryRef,
  );

  return (
    <div>
      <h1>{data.user.name}</h1>
      <img src={data.user.avatar} alt={data.user.name} />
      <p>{data.user.email}</p>
    </div>
  );
};
```

**Important**: The component must be typed as `EntryPointComponent` and receive
the queries via props. Use `usePreloadedQuery` (not `useLazyLoadQuery`) to
consume the preloaded data.

## Nested Entrypoints

Manual entrypoints can preload child entrypoints, enabling progressive loading
and code splitting at multiple levels.

### Example: Search with Nested Results

From `examples/nested_entrypoints/src/search.entrypoint.tsx`:

```tsx
import searchResults_SearchResultsQueryParameters from '#genfiles/queries/searchResults_SearchResultsQuery$parameters';
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/**
 * @route /
 * @param {string?} q
 */
export const entrypoint: EntryPoint<
  ModuleType<'m#search'>,
  EntryPointParams<'/'>
> = {
  root: JSResource.fromModuleId('m#search'),
  getPreloadProps({params, schema}) {
    const {q} = schema.parse(params);

    return {
      queries: {},
      entryPoints: {
        searchResults: {
          entryPointParams: {},
          entryPoint: {
            root: JSResource.fromModuleId('m#search_results'),
            getPreloadProps({}) {
              return {
                queries: {
                  citiesQueryRef: {
                    parameters: searchResults_SearchResultsQueryParameters,
                    variables: {query: q ?? ''},
                  },
                },
              };
            },
          },
        },
      },
    };
  },
};
```

The parent component renders the nested entrypoint using `EntryPointContainer`:

```tsx
import {ModuleType} from '#genfiles/router/js_resource.js';
import {useRouteParams} from '#genfiles/router/router.jsx';
import {Suspense, useEffect, useState} from 'react';
import {
  EntryPoint,
  EntryPointComponent,
  EntryPointContainer,
} from 'react-relay';

/**
 * @resource m#search
 */
export const SearchPage: EntryPointComponent<
  {},
  {searchResults: EntryPoint<ModuleType<'m#search_results'>>}
> = ({entryPoints}) => {
  const {q} = useRouteParams('/');
  const [search, setSearch] = useState(q);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-36">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for cities..."
        className="min-w-lg mb-24 rounded-lg border border-gray-400 p-4"
      />

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

The child component receives its preloaded queries:

```tsx
import {searchResults_SearchResultsQuery} from '#genfiles/queries/searchResults_SearchResultsQuery.graphql.js';
import {EntryPointComponent, graphql, usePreloadedQuery} from 'react-relay';

/**
 * @resource m#search_results
 */
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
    <div className="grid w-full max-w-lg grid-cols-2 justify-items-center lg:grid-cols-3">
      {cities.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
};
```

**Benefits of nested entrypoints:**

- **Progressive code splitting**: Load parent component first, child components
  later
- **Data dependency isolation**: Child queries only execute after parent logic
  runs
- **Reusable components**: Child entrypoints can be used in multiple parent
  routes

## When to Use Manual Entrypoints

Choose manual entrypoints when you need:

- **Complex preloading logic**: Conditional queries based on parameters
- **Nested entrypoints**: Parent-child component hierarchies with separate data
  needs
- **Dynamic route behavior**: Different queries/components based on runtime
  conditions
- **Full control**: You want to explicitly define every aspect of the routing
  behavior

For simpler routes, consider using
[resource-driven entrypoints](./resource-driven-entrypoints.md) which provide a
more concise syntax.

## Type Safety

Pastoria generates TypeScript types for all entrypoints:

- `ModuleType<'m#resource_id'>`: Type of the component for a resource
- `EntryPointParams<'/route/pattern'>`: Type-safe route parameters
- Zod schemas for runtime parameter validation

When you run `pastoria gen`, these types are automatically generated based on
your JSDoc annotations.

## Summary

Manual entrypoints provide:

- ✅ Full control over route behavior
- ✅ Server-side query preloading for instant page loads
- ✅ Code splitting with lazy-loaded resources
- ✅ Nested entrypoints for progressive loading
- ✅ Type-safe route parameters with runtime validation
- ✅ Optimal performance with React Relay's data fetching

Next, learn about
[resource-driven entrypoints](./resource-driven-entrypoints.md) for a more
concise syntax when you don't need manual control.
