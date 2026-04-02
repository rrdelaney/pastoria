<p align="center">
  <img src="/logo.png" alt="Pastoria" width="600" />
</p>

<p align="center">
  A full-stack React framework for building data-driven apps with Relay, powered by Vite.
</p>

---

Pastoria is a React meta-frameworks with an emphasis on type-safety and using
Relay for data. Relay has many advanced features for loading data that Pastoria
natively enables such as partial data load, a normalized store, and optimistic
mutations.

Pastoria uses a file-system based route definitions for pages rendered using
React, and comes with a pre-configured GraphQL server. Pastoria doesn’t enforce
a specific way to build a GraphQL schema, but the starter kits come bundled with
Grats.

In addition to the built-in GraphQL API, Pastoria supports API routes for
integration backend services like `better-auth`.

## Creating a Pastoria App

### Pastoria Templates

It's highly recommend to use [Vite+](https://viteplus.dev/) to create a new
Pastoria app. Pastoria's Vite plugin is quite comprehensive, but Vite+ brings
along just about everything else you could want.

```sh
$ vp create @pastoria@latest
```

This will create a new fully ready Pastoria app complete with Relay, StyleX, a
devserver, and a production setup.

### Starting from Scratch

Although it's recommended to use a template to create new apps, but it's
possible to integrate Pastoria into existing Vite apps as well.

<!-- prettier-ignore -->
> [!NOTE] TODO

### Installing the Pastoria skill

Pastoria distributes a skill for agents using the
[`skills` CLI](https://www.npmjs.com/package/skills). Install the Pastoria skill
with the following:

```sh
$ vp dlx skills add rrdelaney/pastoria
```

### Pastoria Environment

The environment file configured `pastoria/environment.ts` configures the
server-side environment and runtime of the pastoria app. It must default export
a `PastoriaEnvironment` object:

::: code-group

```ts [pastoria/environment.ts]
import {PastoriaEnvironment} from '@pastoria/runtime/server';
import {createContext} from '#lib/server/my-context';
import {schema} from '#lib/server/my-schema';

export default new PastoriaEnvironment({
  schema,
  createContext: () => createContext(),
});
```

:::

The `PastoriaEnvironment` constructor has the following options:

- **`schema`**: The GraphQL schema for the application.This schema will be used
  for both the GraphQL API endpointand the Relay server environment during SSR.
- **`createContext`**: Factory function to create a context for each request.
- **`enableGraphiQLInProduction`**: Enable GraphiQL interface in production. By
  default, GraphiQL is only available in development mode. Set to true to enable
  it in production as well.
- **`persistedQueriesOnlyInProduction`**: Only allow persisted queries to be
  executed in production. When `true`, plain text GraphQL queries will be
  rejected in production. In development mode, plain text queries are always
  allowed (for GraphiQL).

### Root App

Pastoria uses the component defined in `pastoria/app.tsx` as a common parent to
all pages. Use it to:

- Set up shared React providers
- Perform one-time client initialization
- Add global CSS

::: code-group

```ts [pastoria/app.tsx]
import type {PropsWithChildren} from 'react';

import './globals.css';

export default function AppRoot({children}: PropsWithChildren) {
  return (
    <>
      <title>Pastoria Starter</title>
      {children}
    </>
  );
}
```

:::

This component must be the default export, and must render its children.

### Generating Code

Pastoria relies on a lot of code generation for the router to discover routes
and be fully typed. This is automatically run on the development server, but can
be manually run with:

```Shell
$ pastoria
```

This will regenerate all Pastoria code, and can be safely run as many times as
needed.

<!-- prettier-ignore -->
> [!TIP]
> Run `pastoria` during CI, and make sure no files changed with `git diff --exit-code --quiet`

## Page Routes

Pages are a UI defined by a React component rendered on a given route. Pastoria
pages are defined in `page.tsx` files under the `pastoria` directory. Route
variables are defined using `[variable]` directories. For example, the following
files would map to pages:

| File                          | Route       |
| ----------------------------- | ----------- |
| `pastoria/page.tsx`           | `/`         |
| `pastoria/about/page.tsx`     | `/about`    |
| `pastoria/user/[id]/page.tsx` | `/user/:id` |

Pages **must** be named `page.tsx`. Other files in the `pastoria` directory will
be ignored, exlcuding special files like `app.tsx`, `environment.ts`, and
`route.ts`.

### Page Components

Pages **must** default export a React component. This component will be used as
the entry point to the page, and will be rendered as a child of the app
component in `app.tsx`.

::: code-group

```tsx [pastoria/page.tsx]
export default function Page() {
  return <p>Hello Pastoria!</p>;
}
```

Page components will be server rendered and then hydrated on the client on
initial initial navigation, and only client-rendered on subsequent in-app
navigation. Page components are **not** React server components.

### Loading Data

Pastoria exclusively uses [Relay](https://relay.dev) to load data in page
components. To define a query that a page component should load, first create a
query using Relay's
[`usePreloadedQuery`](https://relay.dev/docs/api-reference/use-preloaded-query/)
hook:

::: code-group

```tsx [pastoria/app.tsx]
import {page_GreetingQuery} from '#genfiles/queries/page_GreetingQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

// [!code focus:3]
export type Queries = {
  greeting: page_GreetingQuery;
};

export default function Page({queries}: PastoriaPageProps<'/'>) {
  // [!code focus:8]
  const {greeting} = usePreloadedQuery(
    graphql`
      query page_GreetingQuery @preloadable {
        greeting
      }
    `,
    queries.greeting,
  );

  return <p>{greeting}</p>;
}
```

:::

Next run Relay's code generator to make the generated code available to you:

```sh
$ relay-compiler && pastoria
```

<!-- prettier-ignore -->
> [!WARNING]
> It is possible to use a `useEffect` and `fetch` to load data in a page component,
> but it is highly discouraged. This data will not be present during server-side rendering
> and will cause slow loading for end users.

### Defining Params Schema (`export const schema`)

### Customizing Route Loading (`export const getPreloadProps`)

### Nesting Entrypoints (`export type EntryPoints`)

### Runtime Props (`export type RuntimeProps`)

### Parameters from Parent Entrypoints (`export type ExtraProps`)

## Navigation

## API Routes

## Deployment

## FAQ

::: details Can I use Server components?

Not yet. Server components are often redundant and overstep Relay’s data
management.

:::

::: details Can I use plain JavaScript?

**No.** Pastoria apps use TypeScript to ensure full end-to-end type safety.

:::

```

```
