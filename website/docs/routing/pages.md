---
sidebar_position: 2
---

# Pages

A page is a `page.tsx` file under the `pastoria/` directory with a
default-exported React component. Pages can declare GraphQL queries, custom
parameter schemas, nested entrypoints, and preload logic.

## Minimal page

The simplest page has just a default export:

```tsx
export default function AboutPage() {
  return <div>About us</div>;
}
```

## Page with a Relay query

Pages declare queries via an exported `Queries` type and receive preloaded refs
via `PastoriaPageProps`:

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
      query page_HelloQuery($name: String!) @preloadable {
        greet(name: $name)
      }
    `,
    queries.hello,
  );

  return <div>{greet}</div>;
}
```

When all query variables map directly to URL params, `getPreloadProps` is
auto-generated. Only export it when you need custom logic.

## Page exports reference

| Export             | Required | Purpose                                            |
| ------------------ | -------- | -------------------------------------------------- |
| `default`          | Yes      | React component                                    |
| `type Queries`     | No       | Map of query ref name to Relay query type          |
| `type EntryPoints` | No       | Map of entrypoint name to Relay EntryPoint type    |
| `type ExtraProps`  | No       | Extra data shape from `getPreloadProps`            |
| `schema`           | No       | Zod schema for URL param parsing                   |
| `getPreloadProps`  | No       | Custom preload function (auto-generated if absent) |

**Important:** Do NOT export `RuntimeProps` from a `page.tsx` — pages
automatically receive `{pathname: string; searchParams: URLSearchParams}` as
RuntimeProps.

## `PastoriaPageProps<R>`

The global type `PastoriaPageProps<R>` provides all props to page and
sub-component default exports:

```tsx
export default function Page({
  queries, // Preloaded Relay query refs (from type Queries)
  entryPoints, // Preloaded nested entrypoint refs (from type EntryPoints)
  props, // RuntimeProps — for pages: {pathname, searchParams}
  extraProps, // Extra static data from getPreloadProps (from type ExtraProps)
}: PastoriaPageProps<'/route'>) {}
```

## URL parameter schemas

Route parameters are parsed through a Zod schema. By default, Pastoria
auto-generates the schema from query variables. Export a `schema` constant for
custom validation, optional search params, or type coercion:

```tsx
import {z} from 'zod/v4-mini';

export const schema = z.object({
  name: z.string(),
  q: z.nullish(z.string()), // optional search param
  page: z.nullish(z.coerce.number()), // coerced number param
});
```

## Custom `getPreloadProps`

Controls how URL params map to query variables and which nested entrypoints to
load. If not exported, Pastoria auto-generates one that wires all query
variables from URL params.

The function receives a single object with these fields:

- **`variables`** — the Zod-parsed URL params (path params + search params
  merged and validated against your `schema`)
- **`queries`** — factory functions keyed by your `Queries` type names; call
  `queries.<name>(vars)` to create preload params for that query
- **`entryPoints`** — factory functions keyed by your `EntryPoints` type names;
  call `entryPoints.<name>(vars)` to create preload params for that entrypoint

It returns an object with `queries`, `entryPoints`, and optionally `extraProps`:

```tsx
export const getPreloadProps: GetPreloadProps<'/hello/[name]'> = ({
  variables,
  queries,
  entryPoints,
}) => ({
  queries: {
    hello: queries.hello({name: variables.name}),
  },
  entryPoints: {
    banner: entryPoints.banner({}),
    results: variables.q ? entryPoints.results({q: variables.q}) : undefined,
  },
  extraProps: {
    query: variables.q ?? '',
  },
});
```

## ExtraProps

For computed or derived data that doesn't come from queries or URL params. Set
in `getPreloadProps`, received in the component via `extraProps`:

```tsx
export type ExtraProps = {query: string; sortBy: string};

export const getPreloadProps: GetPreloadProps<'/'> = ({
  variables,
  queries,
}) => ({
  queries: {data: queries.data(variables)},
  extraProps: {
    sortBy: variables.sortBy ?? 'POPULARITY',
    query: variables.q ?? '',
  },
});

export default function HomePage({extraProps}: PastoriaPageProps<'/'>) {
  // extraProps.sortBy, extraProps.query available here
  return <div>Sort: {extraProps.sortBy}</div>;
}
```

## Multiple queries

A page can declare multiple queries. They are all preloaded in parallel on the
server:

```tsx
export type Queries = {
  bannerMessage: page_GreetQuery;
  searchResults: page_SearchResultsQuery;
};

export default function SearchPage({queries}: PastoriaPageProps<'/search'>) {
  const {greet} = usePreloadedQuery(greetQueryDef, queries.bannerMessage);
  const {cities} = usePreloadedQuery(searchQueryDef, queries.searchResults);

  return (
    <div>
      <h1>{greet}</h1>
      {cities.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
}
```

## Relay query rules

- Queries **must** use the `@preloadable` directive so Relay generates
  `$parameters` files for server-side preloading.
- Query naming convention: `<filename>_<QueryName>` (e.g. `page_HelloQuery` for
  a query in `page.tsx`).
- Query types are imported from `#genfiles/queries/<queryName>.graphql.js`.
- Always use `usePreloadedQuery` — not `useLazyLoadQuery`. Lazy loading defeats
  the purpose of server-side rendering.

## Next steps

- Learn about [nested entrypoints](./nested-entrypoints.md) for code splitting
- Set up [client-side navigation](./navigation.md)
- Write [GraphQL queries](../graphql/graphql-queries.md)
