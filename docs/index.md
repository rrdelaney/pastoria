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

```TypeScript [pastoria/environment.ts]
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

| Property                           | Type                         | Description                                                                                                                                                                                                  |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schema`                           | `GraphQLSchema`              | The GraphQL schema for the application.This schema will be used for both the GraphQL API endpointand the Relay server environment during SSR.                                                                |
| `createContext`                    | `(req: Request) => unknown;` | Factory function to create a context for each request.                                                                                                                                                       |
| `enableGraphiQLInProduction`       | `boolean`                    | Enable GraphiQL interface in production. By default, GraphiQL is only available in development mode. Set to true to enable it in production as well.                                                         |
| `persistedQueriesOnlyInProduction` | `boolean`                    | Only allow persisted queries to be executed in production. When `true`, plain text GraphQL queries will be rejected in production. In development mode, plain text queries are always allowed (for GraphiQL) |

### Root App

Pastoria uses the component defined in `pastoria/app.tsx` as a common parent to
all pages. Use it to:

- Set up shared React providers
- Perform one-time client initialization
- Add global CSS

::: code-group

```TypeScript [pastoria/app.tsx]
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
> Run `pastoria` during CI and make sure no files changed with `git diff --exit-code --quiet`

## Page Routes

### Page Components (`export default`)

### Loading Data (`export type Queries`)

### Defining Params Schema (`export const schema`)

### Customizing Route Loading (`export const getPreloadProps`)

### Nesting Entrypoints (`export type EntryPoints`)

### Runtime Props (`export type RuntimeProps`)

### Parameters from Parent Entrypoints (`export type ExtraProps`)

## Navigation

## API Routes

## Deployment

## FAQ

**Can I use Server components?** Not yet. Server components are often redundant
and overstep Relay’s data management.

**Can I use plain JavaScript?** No. Pastoria apps use TypeScript to ensure full
end-to-end type safety.
