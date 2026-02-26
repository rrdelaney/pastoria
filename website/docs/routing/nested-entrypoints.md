---
sidebar_position: 3
---

# Nested Entrypoints

Any `.tsx` file in `pastoria/` that is not `page.tsx`, `app.tsx`, or
`environment.ts` becomes a **nested entrypoint** — a lazily loaded sub-component
for code splitting.

## How it works

Nested entrypoints allow you to split a page into independently loaded
sub-components. The parent page loads first, then child entrypoints load in the
background. Each sub-component can have its own GraphQL queries that are
preloaded on the server.

## Declaring entrypoints in a parent page

The parent page declares nested entrypoints using the `EntryPoints` type export:

```tsx
import {ModuleType, ModuleParams} from '#genfiles/router/js_resource';
import {EntryPoint, EntryPointContainer} from 'react-relay';

export type EntryPoints = {
  banner: EntryPoint<
    ModuleType<'/hello/[name]#banner'>,
    ModuleParams<'/hello/[name]#banner'>
  >;
};
```

The entrypoint ID follows the pattern `/<route>#<filename>` — matching the route
path with `#` separating the sub-component filename (without `.tsx`).

## Rendering entrypoints

Use `EntryPointContainer` from React Relay to render a nested entrypoint. The
`props` passed to `EntryPointContainer` become the sub-component's
`RuntimeProps`:

```tsx
<EntryPointContainer
  entryPointReference={entryPoints.banner}
  props={{helloMessageSuffix: '!'}}
/>
```

Wrap in `<Suspense>` for a loading fallback while the sub-component loads:

```tsx
<Suspense fallback={<div>Loading...</div>}>
  <EntryPointContainer
    entryPointReference={entryPoints.searchResults}
    props={{}}
  />
</Suspense>
```

## Writing a sub-component

A sub-component file exports a default component, optionally with `Queries` and
`RuntimeProps`:

```tsx
// pastoria/hello/[name]/banner.tsx
import {banner_HelloBannerQuery} from '#genfiles/queries/banner_HelloBannerQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  helloBannerRef: banner_HelloBannerQuery;
};

export type RuntimeProps = {
  helloMessageSuffix: string; // passed from parent's EntryPointContainer props
};

export default function HelloBanner({
  queries,
  props,
}: PastoriaPageProps<'/hello/[name]#banner'>) {
  const {helloMessage} = usePreloadedQuery(
    graphql`
      query banner_HelloBannerQuery @preloadable @throwOnFieldError {
        helloMessage
      }
    `,
    queries.helloBannerRef,
  );

  return (
    <div>
      {helloMessage}
      {props.helloMessageSuffix}
    </div>
  );
}
```

Sub-components **can and should** export `RuntimeProps` to declare what the
parent passes via `<EntryPointContainer props={...} />`.

## Complete example

Here is a complete parent page with two nested entrypoints:

**Parent page** (`pastoria/hello/[name]/page.tsx`):

```tsx
import {page_HelloQuery} from '#genfiles/queries/page_HelloQuery.graphql';
import {ModuleType, ModuleParams} from '#genfiles/router/js_resource';
import {useNavigation} from '#genfiles/router/router';
import {Suspense, useState} from 'react';
import {
  EntryPoint,
  EntryPointContainer,
  graphql,
  usePreloadedQuery,
} from 'react-relay';
import {z} from 'zod/v4-mini';

export type Queries = {
  nameQuery: page_HelloQuery;
};

export type EntryPoints = {
  searchResults: EntryPoint<
    ModuleType<'/hello/[name]#results'>,
    ModuleParams<'/hello/[name]#results'>
  >;
  helloBanner: EntryPoint<
    ModuleType<'/hello/[name]#banner'>,
    ModuleParams<'/hello/[name]#banner'>
  >;
};

export type ExtraProps = {
  query: string;
};

export const schema = z.object({
  name: z.string(),
  q: z.nullish(z.string()),
});

export const getPreloadProps: GetPreloadProps<'/hello/[name]'> = ({
  queries,
  entryPoints,
  variables,
}) => ({
  queries: {
    nameQuery: queries.nameQuery({name: variables.name}),
  },
  entryPoints: {
    helloBanner: entryPoints.helloBanner({}),
    searchResults: entryPoints.searchResults({q: variables.q ?? undefined}),
  },
  extraProps: {
    query: variables.q ?? '',
  },
});

export default function HelloWorldPage({
  queries,
  entryPoints,
  extraProps,
}: PastoriaPageProps<'/hello/[name]'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query page_HelloQuery($name: String!) @preloadable @throwOnFieldError {
        greet(name: $name)
      }
    `,
    queries.nameQuery,
  );

  const [search, setSearch] = useState(extraProps.query);

  return (
    <div>
      <EntryPointContainer
        entryPointReference={entryPoints.helloBanner}
        props={{helloMessageSuffix: '!'}}
      />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`${greet} Search for cities...`}
      />
      <Suspense fallback="Loading...">
        <EntryPointContainer
          entryPointReference={entryPoints.searchResults}
          props={{}}
        />
      </Suspense>
    </div>
  );
}
```

**Sub-component** (`pastoria/hello/[name]/results.tsx`):

```tsx
import {results_HelloCityResultsQuery} from '#genfiles/queries/results_HelloCityResultsQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  citiesQuery: results_HelloCityResultsQuery;
};

export default function HelloWorldCityResults({
  queries,
}: PastoriaPageProps<'/hello/[name]#results'>) {
  const {cities} = usePreloadedQuery(
    graphql`
      query results_HelloCityResultsQuery($q: String)
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
    <div>
      {cities.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
}
```

## Conditional loading

Entrypoints can be conditionally loaded based on URL params. Use
`getPreloadProps` to return `undefined` for entrypoints that shouldn't load:

```tsx
export const getPreloadProps: GetPreloadProps<'/users/[id]'> = ({
  variables,
  queries,
  entryPoints,
}) => ({
  queries: {user: queries.user({id: variables.id})},
  entryPoints: {
    details:
      variables.tab === 'details'
        ? entryPoints.details({id: variables.id})
        : undefined,
    activity:
      variables.tab === 'activity'
        ? entryPoints.activity({id: variables.id})
        : undefined,
  },
});
```

Then conditionally render:

```tsx
{
  entryPoints.details && (
    <Suspense fallback={<Loading />}>
      <EntryPointContainer
        entryPointReference={entryPoints.details}
        props={{}}
      />
    </Suspense>
  );
}
```

## Benefits

- **Code splitting** — child components load separately from the parent
- **Progressive rendering** — parent UI appears first, children load in the
  background
- **Isolated data** — each sub-component manages its own GraphQL queries
- **Server preloading** — all queries (parent and child) are preloaded on the
  server

## Next steps

- Learn about [client-side navigation](./navigation.md)
- Set up [API routes](./api-routes.md)
