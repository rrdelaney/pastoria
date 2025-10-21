# Nested Entrypoints Example

This example demonstrates how to use **nested entrypoints** in Pastoria, a pattern that allows you to split code and data loading across multiple components using React Relay's `EntryPoint` API.

## What are Nested Entrypoints?

Nested entrypoints allow you to:

- **Code split** components into separate bundles that load on demand
- **Cascade data loading** where a parent component can trigger child component data fetching
- **Coordinate loading states** using React Suspense boundaries
- **Optimize performance** by only loading what's needed when it's needed

In this example, the search page has two entrypoints:

1. **Parent entrypoint** (`m#search`) - The search input component
2. **Child/nested entrypoint** (`m#search_results`) - The search results component with its GraphQL query

## File Structure

```
src/
├── search.entrypoint.tsx   # Route definition with nested entrypoint config
├── search.tsx              # Components with @resource annotations
├── schema/
│   ├── cities.ts          # GraphQL schema (Grats)
│   └── context.ts         # GraphQL context factory
└── app_root.tsx           # App wrapper with @appRoot
```

## How It Works

### 1. Define Resources with `@resource`

In `src/search.tsx`, both components are marked as resources:

```tsx
/**
 * @resource m#search
 */
export const SearchPage: EntryPointComponent<
  {},
  {searchResults: EntryPoint<ModuleType<'m#search_results'>>}
> = ({entryPoints}) => {
  // ...
  return (
    <EntryPointContainer
      entryPointReference={entryPoints.searchResults}
      props={{}}
    />
  );
};

/**
 * @resource m#search_results
 */
export const SearchResults: EntryPointComponent<
  {citiesQueryRef: search_SearchResultsQuery},
  {}
> = ({queries}) => {
  const {cities} = usePreloadedQuery(
    graphql`
      query search_SearchResultsQuery($query: String!) { ... }
    `,
    queries.citiesQueryRef,
  );
  // ...
};
```

### 2. Configure the Nested Entrypoint

In `src/search.entrypoint.tsx`, the route definition specifies how to load both entrypoints:

```tsx
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
                    parameters: search_SearchResultsQueryParameters,
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

**Key points:**

- The parent entrypoint (`m#search`) has no queries of its own (`queries: {}`)
- It declares a nested entrypoint called `searchResults` in the `entryPoints` object
- The nested entrypoint (`m#search_results`) defines its own query with variables derived from the route params
- Both components are code-split and loaded separately

### 3. Render with Suspense

The parent component uses `EntryPointContainer` to render the nested entrypoint, wrapped in a `Suspense` boundary:

```tsx
<Suspense fallback="Loading...">
  <EntryPointContainer
    entryPointReference={entryPoints.searchResults}
    props={{}}
  />
</Suspense>
```

This allows the search results to load independently while showing a loading state.

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

Visit `http://localhost:3000` and try searching for cities like "San", "New", or "Los".

## How the Search Works

1. User types in the search input
2. After 500ms debounce, the route updates with `?q=<search>`
3. The URL change triggers the entrypoint to reload
4. The nested `searchResults` entrypoint fetches new data with the updated query
5. React Suspense shows "Loading..." while fetching
6. Results appear when the query completes

## Benefits of This Pattern

**Code Splitting**: The `SearchResults` component and its query are in a separate bundle that only loads when needed.

**Data Isolation**: Each entrypoint manages its own data requirements independently.

**Composability**: You can nest entrypoints arbitrarily deep to create complex data loading hierarchies.

**Type Safety**: TypeScript ensures the parent correctly provides the nested entrypoint reference.

## Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

The built application will have separate chunks for each entrypoint, optimizing initial load time.
