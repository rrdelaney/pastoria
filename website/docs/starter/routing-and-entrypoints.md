---
sidebar_position: 2
---

# Routing with EntryPoints

Pastoria uses Relay's **EntryPoint** pattern to combine code-splitting with data fetching.
Each route consists of two files:

1. A React component marked with `@resource` that renders the page.
2. An entrypoint module marked with `@route` that wires the component into the router and
   describes what to preload.

This separation allows Pastoria to load component code and GraphQL data in parallel while
preserving static type safety.

## Creating a basic route

Create `src/about.tsx` with a new resource component:

```tsx
/**
 * @resource m#about
 */
export function AboutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">About Pastoria</h1>
        <p className="mt-4 text-gray-300">Learn more about the framework.</p>
      </div>
    </div>
  );
}
```

Then create `src/about.entrypoint.tsx` to register the route:

```tsx
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/** @route /about */
export const entrypoint: EntryPoint<
  ModuleType<'m#about'>,
  EntryPointParams<'/about'>
> = {
  root: JSResource.fromModuleId('m#about'),
  getPreloadProps() {
    return {
      queries: {},
    };
  },
};
```

Finish by running `pnpm generate:router`. The generator scans for `@resource` and `@route`
annotations and produces type-safe helpers in `__generated__/router/`.

## Routes with parameters

Annotate parameters with JSDoc to enable runtime validation and static typing:

```tsx
/**
 * @route /user/:id
 * @param {string} id
 */
export const entrypoint: EntryPoint<
  ModuleType<'m#user'>,
  EntryPointParams<'/user/:id'>
> = {
  root: JSResource.fromModuleId('m#user'),
  getPreloadProps({params}) {
    console.log('Viewing user', params.id);
    return {queries: {}};
  },
};
```

Supported parameter shapes include required strings, optional values (`{string?}`), numbers,
and arrays (`{string[]}`). Inside your component you can read the parameters with
`useRouteParams('/user/:id')`.

## Preloading GraphQL queries

EntryPoints unlock render-as-you-fetch data loading. Instead of `useLazyLoadQuery`, use the
preloaded-query workflow:

```tsx
import PostsPageQueryParameters from '#genfiles/queries/posts_PostsPageQuery$parameters';
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/** @route /posts */
export const entrypoint: EntryPoint<
  ModuleType<'m#posts'>,
  EntryPointParams<'/posts'>
> = {
  root: JSResource.fromModuleId('m#posts'),
  getPreloadProps() {
    return {
      queries: {
        postsPageQueryRef: {
          parameters: PostsPageQueryParameters,
          variables: {},
        },
      },
    };
  },
};
```

In the associated component, accept a `queries` prop and call `usePreloadedQuery`:

```tsx
import {posts_PostsPageQuery} from '#genfiles/queries/posts_PostsPageQuery.graphql';
import {
  EntryPointComponent,
  graphql,
  usePreloadedQuery,
} from 'react-relay/hooks';

/**
 * @resource m#posts
 */
export const PostsPage: EntryPointComponent<{
  postsPageQueryRef: posts_PostsPageQuery;
}> = ({queries}) => {
  const data = usePreloadedQuery(
    graphql`
      query posts_PostsPageQuery @preloadable {
        posts {
          id
          title
          author
        }
      }
    `,
    queries.postsPageQueryRef,
  );

  return (
    <ul>
      {data.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
};
```

When a route needs URL parameters, parse them inside `getPreloadProps` before passing them
as query variables:

```tsx
/**
 * @route /post/:id
 * @param {string} id
 */
export const entrypoint = {
  root: JSResource.fromModuleId('m#post'),
  getPreloadProps({schema, params}) {
    const {id} = schema.parse(params);
    return {
      queries: {
        postQueryRef: {
          parameters: PostQueryParameters,
          variables: {id},
        },
      },
    };
  },
};
```

Remember to regenerate both the router and Relay artifacts after adding new queries:

```bash
pnpm generate:schema
pnpm generate:relay
pnpm generate:router
```

## Navigation helpers

Use the generated helpers for type-safe navigation:

```tsx
import {Link, RouteLink, useNavigation} from '#genfiles/router/router';

function Navigation() {
  const {push, pushRoute} = useNavigation();

  return (
    <nav>
      <Link href="/about">About</Link>
      <RouteLink route="/user/:id" params={{id: '123'}}>
        View User
      </RouteLink>
      <button onClick={() => pushRoute('/user/:id', {id: '456'})}>Go</button>
      <button onClick={() => push('/posts')}>Posts</button>
    </nav>
  );
}
```

### Checklist for new routes

1. Create a component with `@resource`.
2. Add an entrypoint with `@route` and optional `@param` tags.
3. Configure `getPreloadProps` for any data requirements.
4. Run the generator scripts.
5. Use `Link`, `RouteLink`, or `useNavigation` to connect the route to the rest of your app.
