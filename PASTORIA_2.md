**Pastoria v2.0 is an evolution of the current state of the Pastoria framework. It has the following goals:**

1. **Move away from JSDoc-based routing in favor of a file-system based configuration.**
2. **Remove first-class Grats integration in favor of letting users bring their own schema.**
3. **Simplified CLI experience.**

# Filesystem routing

Pastoria v1 using JSDoc-based tags for routing. For example:

```tsx
/** @route / */
export function MyPage() { /* ... */ }

```

Instead, Pastoria v2 should use filesystem based routing similar to Next.js for routing.
Routable components live under the `/pastoria` directory, name pending change.
Within `/pastoria` routes are defined similar to Next.js's App Router. For example,
`/pastoria/page.tsx` would define rendering for `/`, and `/pastoria/about/page.tsx`
would handle the `/about` route.

## Pages & Queries

Pages are created using a `page.tsx` file under `/pastoria`. Each page file should default export a React component using the prop types `PageProps<RouteName>`, where `RouteName` is the path the route can be accessed at.

Queries consumed by the page should be defined in an exported `queries` const. `queries` must be an object, where keys are the query name as passed into the page component, and values are the query object Relay generates. For a page listing blog posts:

```tsx
// pastoria/posts/page.tsx

export const queries = {
	blogPosts: page_BlogPostsQuery
};

export default function BlogPosts({ queries }: PageProps<'/posts'>) {
	const { posts } = usePreloadedQuery(graphql`
		query page_BlogPostsQuery {
			blogPosts {
				id
				title
				href
			}
		}
	`, queries.blogPosts);
	
	return (
		<div>
			{posts.map(post => (
				<a key={post.id} href={post.href}>{post.title}</a>
			)}
		</div>
	);
}
```

*Under the hood page props are generated to be a `EntryPointProps` with the correct types for queries and nested entry points filled out. Pastoria V1 used to parse type definitions on exported components for this data, but this is no longer required. Pastoria V2 should be able to gather all that information using the filesystem.*

## Parameters

Pages can define parameters using the same syntax as Next.js, a parameter name in square brackets. For example, a page for a given blog post slug in Pastoria would be `pastoria/post/[slug]/page.tsx`. The parameters defined here can be used inside of GraphQL queries for a page. By default, these page parameters are merged with search parameters and used as the variables for the GraphQL query, with page parameters taking preference.

*TODO: should have a way to customize this behavior.*

## Manually Defined Entry Points

Under the hood `page.tsx` files define a standard Relay entry point. In addition to `page.tsx` files these can be created manually using `entrypoint.ts` files. Entry point files are more cumbersome and require more boilerplate, but offer flexibility not available to `page.tsx` files.

```tsx
// pastoria/post/[slug]/edit/entrypoint.ts

const entrypoint: EntryPoint<
  import('./components/PostEditor').PostEditor
  EntryPointParams<'/post/[slug]/edit'>
> = {
	// Root component rendered by the entrypoint, must match the type in EntryPoint.
	// TODO: Figure out how to implement this API?
  root: JSResource(
	  () => import('./components/PostEditor').then((mod) => mod.PostEditor)
	),
  getPreloadProps({params, url, entryPoints}) {
    return {
	    // Any nested entrypoints defined in the filesystem. Must be passed along.
	    entryPoints,
	    // Queries usually defined by `export const queries` but with the flexibility
	    // to manually create variables.
      queries: {
        postContent: {
          parameters: postEditor_PostContentQueryParameters,
          variables: { slug: params.slug },
        },
      },
    };
  },
};

export default entrypoint;
```

## Nested Entry Points as Layout Components

Nested entry points can be defined by creating additional `.page.tsx` files within a directory
under `/pastoria`. For example, to create a "layout" like experience using Pastoria v2:

```
├── pastoria/
|  // Default view, the "layout" in Next.js terms
│  └── page.tsx       
|  // Nested entrypoint, accessible from `props.entryPoints` 
│  └── banner.page.tsx
```

To render a nested entry point from the root `page.tsx`, access the entry point name from `props.entryPoints`:

```tsx
export const queries = {
  // ...
};

export default function Layout({entryPoints}: PageProps<'/'>) {
  return <div>
    {/* ... */}

    <Suspense fallback="Loading...">
      <EntryPointContainer
        entryPointReference={entryPoints.banner}
        props={{}}
      />
    </Suspense>
  </div>
}

```

Remember, entry points only re-render when the inputs to their queries change, so if a "layout" component
has no queries it will never re-render.

## Nested Routes

Nested routes are not yet supported. 

## Root Layout

Pastoria apps can define a query-less root layout that wraps the application in a file exactly named `pastoria/app.tsx`. This file should export a default React component, and is useful for setting up analytics and global metadata. Example:

```tsx
import type {PropsWithChildren} from 'react';

import './globals.css';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Pastoria App</title>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
        rel="stylesheet"
      />

      {children}
    </>
  );
}
```

This is where global React providers should be configured in a Pastoria app.

## API Routes

`route.ts` files under `pastoria/` can export a default `express.Router`  instance that will be forwarded API requests matching the path. An API route for `/api/posts` would have the following handler:

```tsx
// pastoria/api/posts/route.ts

const router = express.Router()

router.use(express.json())
router.get('/', async (req, res) => {
	const posts = await db.posts.findMany();
	res.status(200).send({ posts });
});

export default router;
```

API routes support parameterization via the filesystem, similar to pages. To use params from the filesystem, `mergeParams` should be set when creating the router. An API to get a specific blog post would look like:

```tsx
// pastoria/api/post/[slug]/route.ts

const router = express.Router({ mergeParams: true })

router.use(express.json())
router.get('/', async (req, res) => {
	const slug = req.params.slug;
	const post = await db.posts.findUnique({ slug });
	res.status(200).send({ post });
});

export default router;
```

Catch-all routes can be handled by using express’s native router capabilities:

```tsx
// pastoria/api/auth/route.ts

const router = express.Router();
router.use(express.json())

router.use('*path', async (req, res) => {
  await authHandler(req, res);
});

export default router;
```

# Custom Environments

Pastoria v1 mandated a certain configuration of GraphQL API and server. Pastoria v2 will allow users to bring a custom schema without prescribing a singular library to create it. This will be managed through the `pastoria/environment.ts` file. This should default export a single class instance of `PastoriaEnvironment`.

`PastoriaEnvironment` can be used to create a Relay sever environment, a Relay client environment, and a GraphQL API. Unless overridden using `pastoria/api/graphql/route.ts` Pastoria will use this environment to create a GraphQL API endpoint. Example:

```tsx
// pastoria/environment.ts

export default new PastoriaEnvironment({
	schema: getSchema(),
	createContext: async (req: express.Request) => {
		return new Context();
	},
});
```

This environment file would define how Pastoria creates:

1. A GraphQL API at `/api/graphql`
2. The Relay server environment, using `schema`  and `context`
3. The Relay client environment, configured to call `/api/graphql`

The Relay server & client environments are not configurable at the moment. In the future, Pastoria may introduce an API to allow creating a custom client environment from a pre-configured `network` and `store`.

# Pastoria CLI

The Pastoria V1 CLI concerned itself with code generation for the router, Grats, and Relay. V2 will be dramatically simpler, with only four subcommands. All references to the `justfile` based setup should be removed.

## `pastoria generate`

The `generate` subcommand generates Pastoria routing, types, and resources from the `/pastoria` directory into `__generated__/router`. This command will no longer generate Relay code, as that will be up to the user to run beforehand. The default Pastoria starter will come with a script to do both:

```json
{
	"scripts": {
		"generate": "relay-compiler && pastoria generate"
	}
}
```

## `pastoria dev`

Starts Pastoria’s devserver. This command already exists and needs little modification.

## `pastoria build`

Builds the application for production.

*This command already exists and needs little modification.*

## `pastoria-server`

Starts the application in production mode, must have run `pastoria build` first.

*This command already exists and needs little modification.*
