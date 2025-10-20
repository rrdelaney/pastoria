# Pastoria Starter

A simple starter template for [Pastoria](https://pastoria.dev), a full-stack
JavaScript framework for building data-driven applications.

## What's Inside

This starter template includes:

- **Type-safe routing** with JSDoc annotations
- **React + Relay** for GraphQL data fetching with persisted queries
- **Grats** for type-safe GraphQL schema generation
- **TailwindCSS** for styling

## Getting Started

### Code Generation

Before running the app, generate the GraphQL schema and Relay artifacts:

```bash
# Generate GraphQL schema from TypeScript code
npm run generate:schema

# Generate Relay query artifacts
npm run generate:relay

# Generate the router from route annotations
npm run generate:router
```

Or run all three commands at once:

```bash
npm run generate:schema && npm run generate:relay && npm run generate:router
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your app.

### Production Build

Build the application for production:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

## Project Structure

```
examples/starter/
├── __generated__/           # Generated files (schema, queries, router)
│   ├── schema/              # GraphQL schema from Grats
│   ├── queries/             # Relay compiled queries
│   └── router/
├── public/                  # Static assets
├── src/
│   ├── schema/              # GraphQL resolvers (Grats)
│   │   ├── context.ts       # GraphQL context factory
│   │   └── hello.ts         # Example queries
│   ├── app_root.tsx         # App root component (@appRoot)
│   ├── home.tsx             # Home page component (@resource m#home)
│   └── home.entrypoint.ts   # Route definition (@route /)
├── package.json
├── relay.config.json        # Relay compiler config
└── tsconfig.json            # TypeScript config
```

## Adding Routes

Pastoria uses **EntryPoints**, a pattern from Relay that enables the
"render-as-you-fetch" paradigm. EntryPoints bundle together a React component
and its data requirements, allowing Pastoria to start loading both code and data
in parallel before rendering begins.

### Understanding EntryPoints

An EntryPoint consists of two parts:

1. **A resource component** marked with `@resource` - the React component that
   will render
2. **An entrypoint file** marked with `@route` - defines the route path and data
   preloading logic

This separation allows Pastoria to:

- Load component code and GraphQL data in parallel
- Generate type-safe routing with automatic parameter validation
- Lazy-load routes for better performance

### Creating a Basic Route

Let's create a new route for an "About" page at `/about`.

#### Step 1: Create the Component

Create `src/about.tsx`:

```tsx
/**
 * @resource m#about
 */
export function AboutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">About Us</h1>
        <p className="mt-4 text-gray-300">Learn more about our project</p>
      </div>
    </div>
  );
}
```

The `@resource m#about` tag registers this component as a loadable resource with
the module ID `m#about`.

#### Step 2: Create the EntryPoint

Create `src/about.entrypoint.tsx`:

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
  getPreloadProps({}) {
    return {
      queries: {},
    };
  },
};
```

The `@route /about` tag registers this entrypoint at the `/about` path.

#### Step 3: Regenerate the Router

Run the router generator to update the routing configuration:

```bash
npm run generate:router
```

This scans your code for `@route` and `@resource` tags and generates type-safe
routing code in `__generated__/router/`.

Now you can navigate to `/about` in your app!

### Creating Routes with Parameters

Routes can have dynamic parameters in the URL. Parameters can be defined as path
segments (e.g., `/user/:id`) or query strings (e.g., `/search?q=term`).

#### Example: User Profile Route

Create `src/user.tsx`:

```tsx
import {useRouteParams} from '#genfiles/router/router';

/**
 * @resource m#user
 */
export function UserPage() {
  const {id} = useRouteParams('/user/:id');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">User Profile</h1>
      <p>User ID: {id}</p>
    </div>
  );
}
```

Create `src/user.entrypoint.tsx`:

```tsx
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

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
    // params.id is type-safe and validated!
    console.log('Loading user:', params.id);
    return {
      queries: {},
    };
  },
};
```

The `@param {string} id` annotation uses JSDoc syntax:

- Documents that `id` is a required string parameter
- Generates a Zod schema for runtime validation
- Provides TypeScript types for `params.id`

Supported parameter types:

- `{string}` - Required string, URL-decoded automatically
- `{number}` - Coerced to number
- `{string?}` - Optional string parameter
- `{string[]}` - Array of strings

After regenerating the router, you can navigate to `/user/123` and `params.id`
will be `"123"`.

### Preloading GraphQL Queries

The real power of EntryPoints comes from preloading data. The `getPreloadProps`
function specifies which GraphQL queries to load, and your component receives
preloaded query references via the `queries` prop.

#### Example: Route with Data

First, create the entrypoint that defines what to preload. Create
`src/posts.entrypoint.tsx`:

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
  getPreloadProps({}) {
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

The `queries` object in `getPreloadProps` tells Pastoria to preload the query
before rendering. This enables the render-as-you-fetch pattern - the query
starts loading as soon as the route is matched, before the component code has
even finished downloading.

Now create the component that uses the preloaded query. Create `src/posts.tsx`:

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
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Posts</h1>
      <ul>
        {data.posts.map((post) => (
          <li key={post.id} className="mb-2">
            <strong>{post.title}</strong> by {post.author}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

Key differences from `useLazyLoadQuery`:

- Use `EntryPointComponent` type for your component instead of a regular
  function
- Accept a `queries` prop that contains your preloaded query references
- Use `usePreloadedQuery` instead of `useLazyLoadQuery`
- Add `@preloadable` directive to your GraphQL query
- The query is already loading when your component renders (no loading state
  needed!)

#### Example: Query with Variables

You can pass variables from route parameters to your GraphQL query. This is
useful for loading data based on the URL.

Create `src/post.entrypoint.tsx`:

```tsx
import PostQueryParameters from '#genfiles/queries/post_PostQuery$parameters';
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/**
 * @route /post/:id
 * @param {string} id
 */
export const entrypoint: EntryPoint<
  ModuleType<'m#post'>,
  EntryPointParams<'/post/:id'>
> = {
  root: JSResource.fromModuleId('m#post'),
  getPreloadProps({schema, params}) {
    const {id} = schema.parse(params);

    return {
      queries: {
        postQueryRef: {
          parameters: PostQueryParameters,
          variables: {
            id,
          },
        },
      },
    };
  },
};
```

Create `src/post.tsx`:

```tsx
import {post_PostQuery} from '#genfiles/queries/post_PostQuery.graphql';
import {
  EntryPointComponent,
  graphql,
  usePreloadedQuery,
} from 'react-relay/hooks';

/**
 * @resource m#post
 */
export const PostPage: EntryPointComponent<{
  postQueryRef: post_PostQuery;
}> = ({queries}) => {
  const data = usePreloadedQuery(
    graphql`
      query post_PostQuery($id: ID!) @preloadable {
        post(id: $id) {
          id
          title
          content
          author
        }
      }
    `,
    queries.postQueryRef,
  );

  return (
    <div className="p-8">
      <h1 className="mb-4 text-3xl font-bold">{data.post.title}</h1>
      <p className="mb-2 text-sm text-gray-500">By {data.post.author}</p>
      <div className="prose">{data.post.content}</div>
    </div>
  );
};
```

The `params.id` from the route is passed as a variable to the GraphQL query.
When navigating to `/post/123`, the query preloads with `id: "123"`.

**Important steps after adding queries:**

1. Add your GraphQL schema definition (see "Adding GraphQL Queries" section
   below)
2. Run `npm run generate:schema` to generate the schema
3. Run `npm run generate:relay` to compile the query
4. Run `npm run generate:router` to update the routing

### Navigation

Use the generated `Link` and `RouteLink` components for type-safe navigation:

```tsx
import {Link, RouteLink} from '#genfiles/router/router';

function Navigation() {
  return (
    <nav>
      {/* Simple link */}
      <Link href="/about">About</Link>

      {/* Type-safe route link with params */}
      <RouteLink route="/user/:id" params={{id: '123'}}>
        View User
      </RouteLink>
    </nav>
  );
}
```

Or use the `useNavigation` hook for programmatic navigation:

```tsx
import {useNavigation} from '#genfiles/router/router';

function MyComponent() {
  const {push, pushRoute} = useNavigation();

  const handleClick = () => {
    // Navigate to a path
    push('/about');

    // Or navigate to a route with type-safe params
    pushRoute('/user/:id', {id: '123'});
  };

  return <button onClick={handleClick}>Go</button>;
}
```

### Summary: Adding a New Route

1. Create a component file with `@resource` tag (e.g., `src/mypage.tsx`)
2. Create an entrypoint file with `@route` tag (e.g.,
   `src/mypage.entrypoint.tsx`)
3. Use `@param` tags to define any route parameters
4. Configure GraphQL queries in `getPreloadProps` if needed
5. Run `npm run generate:router` to update the routing
6. If you added queries, also run `generate:schema` and `generate:relay`

## Adding GraphQL Queries

1. Add a query field in `src/schema/`:

```typescript
/**
 * @gqlQueryField
 */
export function myQuery(ctx: Context): string {
  return 'Hello!';
}
```

2. Regenerate the schema:

```bash
npm run generate:schema
```

3. Use it in a component with a preloaded query. See the "Preloading GraphQL
   Queries" section above for how to create an entrypoint that preloads the
   query, and use `usePreloadedQuery` in your component:

```tsx
import {
  EntryPointComponent,
  graphql,
  usePreloadedQuery,
} from 'react-relay/hooks';

export const MyComponent: EntryPointComponent<{
  myQueryRef: MyComponentQuery;
}> = ({queries}) => {
  const data = usePreloadedQuery(
    graphql`
      query MyComponentQuery @preloadable {
        myQuery
      }
    `,
    queries.myQueryRef,
  );

  return <div>{data.myQuery}</div>;
};
```

4. Create the entrypoint file and regenerate artifacts:

```bash
npm run generate:relay
npm run generate:router
```

## Learn More

- [Pastoria Documentation](https://pastoria.dev)
- [Relay Documentation](https://relay.dev)
- [Grats Documentation](https://grats.capt.dev)
- [React Documentation](https://react.dev)
