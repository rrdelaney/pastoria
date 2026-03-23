<p align="center">
  <img src=".github/logos/logo.png" alt="Pastoria" width="600" />
</p>

<p align="center">
  A full-stack React framework for building data-driven apps with Relay, distributed as a Vite plugin.
</p>

---

Pastoria is a full-stack React framework for building data-driven apps with
Relay, distributed as a Vite plugin.

It’s comparable to other React meta-frameworks with an emphasis on type-safety
and using Relay for data. Relay has many advanced features for loading data that
Pastoria natively enables such as partial data load, a normalized store, and
optimistic mutations.

Pastoria uses a file-system based router for defining pages rendered using
React, and comes with a pre-configured GraphQL server. Pastoria doesn’t enforce
a specific way to build a GraphQL schema, but the starter kits recommend Grats.

## Creating a Pastoria App

It's recommended to use a template to create new apps, but it's possible to
integrate Pastoria into existing Vite apps as well.

### Pastoria Templates (create-pastoria)

### Starting from Scratch

### Pastoria Environment (environment.ts)

### Root App (app.ts)

### Generating Code (pastoria generate)

## Page Routes

### Page Components (export default)

### Loading Data (queries)

### Defining Params Schema (schema)

### Customizing Route Loading (getPreloadProps)

### Nesting Entrypoints (entrypoints)

### Runtime Props (RuntimeProps)

### Parameters from Parent Entrypoints (ExtraProps)

## Navigation

## API Routes

## Deployment

## FAQ

**Can I use Server components?** Not yet. Server components are often redundant
and overstep Relay’s data management.

**Can I use plain JavaScript?** No. Pastoria apps use TypeScript to ensure full
end-to-end type safety.
