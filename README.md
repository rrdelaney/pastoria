<p align="center">
  <img src=".github/logos/logo.png" alt="Pastoria" width="600" />
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

### Installing the Pastoria skill

Pastoria distributes a skill for agents using the
[`skills` CLI](https://www.npmjs.com/package/skills). Install the Pastoria skill
with the following:

```sh
$ vp dlx skills add rrdelaney/pastoria
```

### Pastoria Environment (`environment.ts`)

### Root App (`app.ts`)

### Generating Code (`pastoria`)

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
