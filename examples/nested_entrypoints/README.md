# Nested Entrypoints Example

This example demonstrates how to use **nested entrypoints** in Pastoria, a
pattern that allows you to split code and data loading across multiple
components using React Relay's `EntryPoint` API.

## What are Nested Entrypoints?

Nested entrypoints allow you to:

- **Code split** components into separate bundles that load on demand
- **Cascade data loading** where a parent component can trigger child component
  data fetching
- **Coordinate loading states** using React Suspense boundaries
- **Optimize performance** by only loading what's needed when it's needed

In this example, the hello world page has two entrypoints:

1. **Parent entrypoint** (`m#hello`) - The greeting component with search input
2. **Child/nested entrypoint** (`m#hello_results`) - The city search results
   component with its GraphQL query

## File Structure

```
src/
├── hello_world.tsx        # Components with @resource annotations
├── schema/
│   ├── cities.ts         # GraphQL schema (Grats)
│   └── context.ts        # GraphQL context factory
└── app_root.tsx          # App wrapper with @appRoot
```

## How It Works

### 1. Define Resources with `@resource` and TypeScript Types

In `src/hello_world.tsx`, both components are marked as resources. Pastoria
automatically detects queries and nested entrypoints by analyzing the TypeScript
types:

```tsx
/**
 * @route /hello/:name
 * @resource m#hello
 * @param {string} name
 * @param {string?} q
 */
export const HelloWorld: EntryPointComponent<
  {nameQuery: helloWorld_HelloQuery},  // ← Query detected from type!
  {searchResults: EntryPoint<ModuleType<'m#hello_results'>>}  // ← Nested entrypoint detected!
> = ({queries, entryPoints}) => {
  const {greet} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloQuery($name: String!) { ... }
    `,
    queries.nameQuery,
  );

  return (
    <EntryPointContainer
      entryPointReference={entryPoints.searchResults}
      props={{}}
    />
  );
};

/**
 * @resource m#hello_results
 */
export const HelloWorldCityResults: EntryPointComponent<
  {citiesQuery: helloWorld_HelloCityResultsQuery},  // ← Query detected from type!
  {}
> = ({queries}) => {
  const {cities} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloCityResultsQuery($q: String) { ... }
    `,
    queries.citiesQuery,
  );
  // ...
};
```

Pastoria extracts everything from your TypeScript types—no additional annotations needed!

### 2. Automatic Entrypoint Generation

When you run `pastoria gen`, it:

1. Finds components with both `@route` and `@resource` annotations
2. Analyzes the `EntryPointComponent` type parameters
3. Detects `nameQuery` in the first type parameter → creates query preload
4. Detects `searchResults` in the second type parameter → creates nested
   entrypoint
5. Extracts the module ID `'m#hello_results'` from the `ModuleType` generic
6. Generates all the entrypoint boilerplate automatically

**Generated code equivalent (you don't write this!):**

```tsx
export const entrypoint = {
  root: JSResource.fromModuleId('m#hello'),
  getPreloadProps({params, schema}) {
    const {name, q} = schema.parse(params);

    return {
      queries: {
        nameQuery: {
          parameters: helloWorld_HelloQueryParameters,
          variables: {name},
        },
      },
      entryPoints: {
        searchResults: {
          entryPointParams: {},
          entryPoint: {
            root: JSResource.fromModuleId('m#hello_results'),
            getPreloadProps({}) {
              return {
                queries: {
                  citiesQuery: {
                    parameters: helloWorld_HelloCityResultsQueryParameters,
                    variables: {q},
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

**Key points:**

- The parent entrypoint preloads its own `nameQuery`
- It creates a nested entrypoint called `searchResults` that loads
  `m#hello_results`
- The nested entrypoint preloads `citiesQuery` with route params
- Both components are code-split and loaded separately
- All of this is generated from your TypeScript types!

### 3. Render with Suspense

The parent component uses `EntryPointContainer` to render the nested entrypoint,
wrapped in a `Suspense` boundary:

```tsx
<Suspense fallback="Loading...">
  <EntryPointContainer
    entryPointReference={entryPoints.searchResults}
    props={{}}
  />
</Suspense>
```

This allows the search results to load independently while showing a loading
state.

## Running the Example

```bash
# Install dependencies
pnpm install

# Generate GraphQL schema (via Grats)
pnpm generate:schema

# Compile Relay queries
pnpm generate:relay

# Generate Pastoria router
pnpm generate:router

# Start dev server
pnpm dev
```

Visit `http://localhost:3000` and try searching for cities like "San", "New", or
"Los".

## How the Search Works

1. User types in the search input
2. After 500ms debounce, the route updates with `?q=<search>`
3. The URL change triggers the entrypoint to reload
4. The nested `searchResults` entrypoint fetches new data with the updated query
5. React Suspense shows "Loading..." while fetching
6. Results appear when the query completes

## Benefits of This Pattern

**Code Splitting**: The `SearchResults` component and its query are in a
separate bundle that only loads when needed.

**Data Isolation**: Each entrypoint manages its own data requirements
independently.

**Composability**: You can nest entrypoints arbitrarily deep to create complex
data loading hierarchies.

**Type Safety**: TypeScript ensures the parent correctly provides the nested
entrypoint reference.

## Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

The built application will have separate chunks for each entrypoint, optimizing
initial load time.
