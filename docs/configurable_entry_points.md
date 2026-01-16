This document is building on top of the File Based Routing proposal that
introduced Pastoria 2. In that document we introduced the concept of
configurable entrypoints that allow the user to manually specify how nexted
entrypoints are loaded and how URL parameters map to GraphQL query variables. In
this document we specify and expand how configurable entrypoints work.

# `entrypoint.ts`

For each route's `page.tsx` file we generate and entry point in `router.tsx`
that looks something like the following:

```tsx
function entrypoint_fs_page__hello__name__(): EntryPoint<
  ModuleType<'fs:page(/hello/[name])'>,
  EntryPointParams<'/hello/:name'>
> {
  const schema = z.object({
    name: z.pipe(z.string(), z.transform(decodeURIComponent)),
    q: z.pipe(
      z.nullish(z.pipe(z.string(), z.transform(decodeURIComponent))),
      z.transform((s) => (s == null ? undefined : s)),
    ),
  });

  function getPreloadProps({params}: {params: Record<string, any>}) {
    const variables = schema.parse(params);
    return {
      queries: {
        nameQuery: {
          parameters: page_HelloQueryParameters,
          variables: {name: variables.name},
        },
      },
      entryPoints: {
        hello_banner: {
          entryPointParams: {},
          entryPoint: {
            root: JSResource.fromModuleId(
              'fs:page(/hello/[name])#hello_banner',
            ),
            getPreloadProps() {
              return {
                queries: {
                  helloBannerRef: {
                    parameters: helloBanner_QueryParameters,
                    variables: {},
                  },
                },
                entryPoints: undefined,
              };
            },
          },
        },
        hello_results: {
          entryPointParams: {},
          entryPoint: {
            root: JSResource.fromModuleId(
              'fs:page(/hello/[name])#hello_results',
            ),
            getPreloadProps() {
              return {
                queries: {
                  citiesQuery: {
                    parameters: helloResults_CityResultsQueryParameters,
                    variables: {q: variables.q},
                  },
                },
                entryPoints: undefined,
              };
            },
          },
        },
      },
    };
  }
  return {
    root: JSResource.fromModuleId('fs:page(/hello/[name])'),
    getPreloadProps,
  };
}
```

This generated entry point works for the majority of use-cases, but we want to
expose the internals for configuration too. The goals here are:

1. Allow users to transform incoming parameters to GraphQL query variables.
2. Specify how entry points are loaded per-route. Some entrypoints should not be
   loaded depending on query parameters.

To solve these issues we are going to introduce route `entrypoint.ts` files.
Entrypoint files have a few rules that must be followed:

1. Each entrypoint file must have a colocated `page.tsx` file.
2. Nested entrypoints cannot have `entrypoint.ts`, e.g. THERE CANNOT BE
   `nested.entrypoints.ts`.
3. Entrypoint files must have exactly two exports: `default` and `schema`.
4. Entrypoint files MUST NOT import full `.graphql.ts` files, they must only
   import `$parameters`. This would otherwise default the putpose of parallel
   data and code loading. If a user chooses to do this we should not stop them,
   but it MUST NOT BE A REQUIREMENT.
5. Entrypoint files MUST NOT generate code in `router.tsx` that imports the full
   GraphQL query object. `router.tsx` MUST ONLY import entrypoint files and
   `$parameters`.

## Example `entrypoint.ts`

```tsx
// pastoria/hello/[name]/entrypoint.ts

export const schema = z.object({
  name: z.string().transform(decodeURIComponent),
});

export default function getPreloadProps({
  params,
  queries,
  entryPoints,
}: EntryPointParams<'/hello/[name]'>): PreloadPropsForRoute<'/hello/[name]'> {
  // This is fully typed according to `schema`.
  const isRyan = params.name === 'ryan';

  // The return type is checked to be correct by `PreloadPropsForRoute`.
  return {
    queries: {
      // queries.nameQuery is generated from the `queries` export of `page.tsx`. Each exported query should
      // generate a function that will be called with the type-checked variables required for that query.
      // The generated function will return the shape that goes here. For example, this function would return:
      //   (variables: page_NameQuery$variables) => ({ parameters: page_NameQueryParameters, variables })
      nameQuery: queries.nameQuery(params), // Pass-through is still type checked here.
    },
    entryPoints: {
      // Similar to the above `queries.nameQuery` function, `entryPoints` are functions generated from nested
      // entry points (e.g. `banner.page.tsx`) that when called return an appropriate value for a given entry point.
      // For nested entry points, the argument to this function is the combined type of all GraphQL queries. E.g.
      // if the nested entrypoint `banner` had two queries `query One($isRyan: String)` and `query Two($notRyan: Int!)`
      // the argument would be typed: `{ isRyan?: string; notRyan: number }`.
      // In this case, this function would look like:
      //  (params: page_BannerQuery$variables) => ({ entryPointParams: {}, entryPoint: { /* ... */ } })
      banner: entryPoints.banner({isRyan}),
    },
  };
}
```

# Prerequities

We must implement the following before moving on to looking for

- [x] Remove `schema.parse` from generated `getPreloadProps` to prevent double
      parsing. Params should come into `getPreloadProps` pre-parsed.
- [x] Refactor `ROUTER_CONF` to reference path names (`/hello/[name]` instead of
      `/hello/:name`). Required for referencing
      `EntryPointParams<'/hello/[name]'>`.
- [x] Add `queries` functions to `EntryPointParams` and use this in generated
      code for entry points.
- [x] Add `entryPoints` functions to `EntryPointParams` and use this in
      generated code for entry points.
- [x] Begin generating `PreloadPropsForRoute` and use it in return types for
      `getPreloadProps`. This should be an instantiated `PreloadProps` from
      `react-relay/hooks`.
- [x] Fix type inference for `loadEntryPoint` calls in `router.tsx`.
      Encapsulated the necessary cast in `loadRouteEntryPoint` helper with
      documentation explaining why it's needed (Relay's contravariant params
      inference from union types).

OPTIONAL: the code that generated nested entrypoints currently does it inline.
It may be significantly easier to generate the e.g. `entryPoint.banner`
functions if nested entry points were placed into their own entry point
definition functions.

# Implementation

**STATUS: COMPLETE** - Custom `entrypoint.ts` files are now supported.

~~Once the above tasks are completed, implementing support for `entrypoint.ts`
should be fairly straightforward.~~

The implementation works as follows:

1. When parsing the file system, if we find an `entrypoint.ts` file colocated
   with a `page.tsx`, the custom entrypoint is associated with that page.
2. The `page.tsx` file still provides the component, but `getPreloadProps` and
   `schema` are imported from `entrypoint.ts`.
3. The generated code still creates query and entry point helpers, which are
   passed to the custom `getPreloadProps` function.

The generated code for custom entry points looks like:

```tsx
function entrypoint_fs_page__hello__name__() {
  const queryHelpers = {
    nameQuery: (variables: page_HelloQuery$variables) => ({
      parameters: page_HelloQueryParameters,
      variables,
    }),
  };
  const entryPointHelpers = {
    hello_banner: (variables: helloBanner_Query$variables) => ({
      entryPointParams: {},
      entryPoint: {
        root: JSResource.fromModuleId('fs:page(/hello/[name])#hello_banner'),
        getPreloadProps() {
          return {
            queries: {
              helloBannerRef: {parameters: helloBanner_QueryParameters, variables},
            },
            entryPoints: undefined,
          };
        },
      },
    }),
  };
  return {
    root: JSResource.fromModuleId('fs:page(/hello/[name])'),
    getPreloadProps: (p: {params: Record<string, unknown>}) =>
      customEp_fs_page__hello__name__({
        params: p.params as z.infer<typeof customEp_fs_page__hello__name___schema>,
        queries: queryHelpers,
        entryPoints: entryPointHelpers,
      }),
  };
}
```
