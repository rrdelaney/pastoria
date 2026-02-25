---
name: pastoria
description: Create and modify pages, routes, nested entrypoints, and Relay queries in this Pastoria app. Use this skill when adding new pages, routes, components with GraphQL data, or modifying the routing structure.
---

# Pastoria App Reference

This is a **Pastoria** app — a full-stack React framework with file-based
routing, React Relay for GraphQL data fetching, and server-side rendering.

## Project Structure

```
pastoria/              # All routes and app config
  app.tsx              # App shell wrapping all pages (optional)
  environment.ts       # PastoriaEnvironment config (GraphQL schema)
  globals.css          # Global styles (typically imports tailwindcss)
  <route>/page.tsx     # Routable pages
  <route>/other.tsx    # Nested entrypoints (lazy sub-components)
  api/**/route.ts      # Server API routes (Express handlers)
__generated__/         # Generated code — never hand-edit
  router/              # Pastoria-generated router, entrypoints, types
  queries/             # Relay-generated query artifacts
```

Required path aliases (in `package.json` `"imports"` and `tsconfig.json`
`"paths"`):

- `#pastoria/*` maps to `./pastoria/*`
- `#genfiles/*` maps to `./__generated__/*`

## File-Based Routing Conventions

| File pattern | Result |
| --- | --- |
| `pastoria/<path>/page.tsx` | Route at `/<path>` |
| `pastoria/<path>/[param]/page.tsx` | Dynamic route at `/<path>/:param` |
| `pastoria/<path>/other.tsx` | Nested entrypoint `/<path>#other` |
| `pastoria/api/<path>/route.ts` | Express API handler at `/api/<path>` |

Reserved files (never treated as routes): `app.tsx`, `app.ts`,
`environment.ts`.

## Pages

A page is a `page.tsx` file with a default-exported React component.

### Minimal page (no data fetching)

```tsx
export default function MyPage() {
  return <div>Hello</div>;
}
```

### Page with a Relay query

```tsx
import {page_MyQuery} from '#genfiles/queries/page_MyQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  myData: page_MyQuery;
};

export default function MyPage({queries}: PastoriaPageProps<'/my-route'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_MyQuery @preloadable {
        someField
      }
    `,
    queries.myData,
  );
  return <div>{data.someField}</div>;
}
```

### Page with dynamic params

```tsx
import {page_UserQuery} from '#genfiles/queries/page_UserQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  user: page_UserQuery;
};

export default function UserPage({queries}: PastoriaPageProps<'/user/[id]'>) {
  const data = usePreloadedQuery(
    graphql`
      query page_UserQuery($id: String!) @preloadable {
        user(id: $id) { name }
      }
    `,
    queries.user,
  );
  return <div>{data.user.name}</div>;
}
```

When all query variables map directly to URL params, `getPreloadProps` is
auto-generated. Only export it when custom logic is needed.

### Optional search params via Zod schema

Export a `schema` to accept search params beyond the path params:

```tsx
import {z} from 'zod/v4-mini';

export const schema = z.object({
  id: z.string(),
  tab: z.nullish(z.string()),
  page: z.nullish(z.coerce.number()),
});
```

### Custom getPreloadProps

Controls how URL params map to query variables and which nested entrypoints
load:

```tsx
export const getPreloadProps: GetPreloadProps<'/my-route/[id]'> = ({
  variables,
  queries,
  entryPoints,
}) => ({
  queries: {
    user: queries.user({id: variables.id}),
  },
  entryPoints: {
    details: variables.tab === 'details'
      ? entryPoints.details({id: variables.id})
      : undefined,
  },
  extraProps: {
    tab: variables.tab ?? 'overview',
  },
});
```

### ExtraProps

Computed/derived data set in `getPreloadProps`, received in the component:

```tsx
export type ExtraProps = {tab: string};

// Set via getPreloadProps: extraProps: { tab: variables.tab ?? 'overview' }

export default function MyPage({extraProps}: PastoriaPageProps<'/my-route/[id]'>) {
  const [tab, setTab] = useState(extraProps.tab);
  // ...
}
```

## Page Exports Reference

| Export | Required | Purpose |
| --- | --- | --- |
| `default` | Yes | React component |
| `type Queries` | No | Map of query ref name to Relay query type |
| `type EntryPoints` | No | Map of entrypoint name to Relay EntryPoint type |
| `type ExtraProps` | No | Extra data shape from `getPreloadProps` |
| `schema` | No | Zod schema for URL param parsing |
| `getPreloadProps` | No | Custom preload function (auto-generated if absent) |

Pages must NOT export `RuntimeProps`. Pages automatically receive
`{pathname: string; searchParams: URLSearchParams}` as RuntimeProps.

## PastoriaPageProps

`PastoriaPageProps<RouteId>` is the global type for all page and entrypoint
component props:

```tsx
export default function Page({
  queries,     // Preloaded Relay query refs (from type Queries)
  entryPoints, // Preloaded nested entrypoint refs (from type EntryPoints)
  props,       // RuntimeProps — for pages: {pathname, searchParams}
  extraProps,  // Extra static data from getPreloadProps (from type ExtraProps)
}: PastoriaPageProps<'/route'>) {}
```

## Nested Entrypoints

Any `.tsx` file in `pastoria/` that is not `page.tsx`, `app.tsx`, or
`environment.ts` becomes a nested entrypoint — a lazily loaded sub-component
for code-splitting.

### Declaration in the parent page

```tsx
import {ModuleType, ModuleParams} from '#genfiles/router/js_resource';
import {EntryPoint, EntryPointContainer} from 'react-relay';

export type EntryPoints = {
  details: EntryPoint<
    ModuleType<'/user/[id]#details'>,
    ModuleParams<'/user/[id]#details'>
  >;
};
```

### Rendering

```tsx
<EntryPointContainer
  entryPointReference={entryPoints.details}
  props={{editable: true}}
/>
```

### Sub-component file

```tsx
// pastoria/user/[id]/details.tsx
import {details_DetailsQuery} from '#genfiles/queries/details_DetailsQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  detailsRef: details_DetailsQuery;
};

export type RuntimeProps = {
  editable: boolean; // Passed via parent's EntryPointContainer props={}
};

export default function Details({
  queries,
  props, // RuntimeProps
}: PastoriaPageProps<'/user/[id]#details'>) {
  const data = usePreloadedQuery(
    graphql`
      query details_DetailsQuery($id: String!) @preloadable {
        user(id: $id) { bio }
      }
    `,
    queries.detailsRef,
  );
  return <div>{data.user.bio}</div>;
}
```

Sub-components CAN and SHOULD export `RuntimeProps` to declare what the parent
passes via `<EntryPointContainer props={...} />`.

## API Routes

A `route.ts` file with a default-exported Express router:

```ts
import express from 'express';

const router = express.Router({mergeParams: true});

router.get<'/', {name: string}>('/', (req, res) => {
  res.json({greeting: `Hello ${req.params.name}`});
});

export default router;
```

## Client-Side Navigation

Imports from the generated router:

```tsx
import {useNavigation, Link, RouteLink} from '#genfiles/router/router';

// Programmatic navigation
const {push, replace, pushRoute, replaceRoute} = useNavigation();
pushRoute('/user/[id]', {id: '123'});
replaceRoute('/search', {q: 'test', page: 2});

// Link components
<Link href="/about">About</Link>
<RouteLink route="/user/[id]" params={{id: '123'}}>Profile</RouteLink>
```

`pushRoute`/`replaceRoute` fill path params from the route ID template and put
remaining params in the query string.

## Relay Query Rules

- Queries must use `@preloadable` so Relay generates `$parameters` files for
  server-side preloading.
- Query naming convention: `<filename>_<QueryName>` (e.g. `page_UserQuery` for
  a query in `page.tsx`, `details_DetailsQuery` for `details.tsx`).
- Query types are imported from `#genfiles/queries/<queryName>.graphql.js`.
- Primary page queries use `usePreloadedQuery` — not `useLazyLoadQuery`.

## Code Generation

After creating or removing pages, entrypoints, or API routes, code generation
must run to update the router artifacts. In development (`pastoria dev`), this
happens automatically on file changes. Otherwise run the project's generate
script (typically `pnpm generate` or `pnpm run generate`).
