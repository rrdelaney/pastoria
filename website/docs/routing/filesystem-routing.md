---
sidebar_position: 1
---

# Filesystem-Based Routing

Pastoria uses filesystem-based routing, where the file structure under the
`pastoria/` directory defines your application's routes. This approach is
inspired by Next.js App Router, making it intuitive and familiar.

## How It Works

Routes are defined by creating `page.tsx` files within the `pastoria/`
directory. The file path directly maps to the URL path:

| File Path                            | URL Route          |
| ------------------------------------ | ------------------ |
| `pastoria/page.tsx`                  | `/`                |
| `pastoria/about/page.tsx`            | `/about`           |
| `pastoria/posts/page.tsx`            | `/posts`           |
| `pastoria/posts/[id]/page.tsx`       | `/posts/:id`       |
| `pastoria/users/[id]/posts/page.tsx` | `/users/:id/posts` |

## Directory Structure

A typical Pastoria routing structure looks like:

```
pastoria/
├── app.tsx                    # Optional root layout (wraps all pages)
├── environment.ts             # GraphQL environment configuration
├── page.tsx                   # Home page (/)
├── about/
│   └── page.tsx              # About page (/about)
├── posts/
│   ├── page.tsx              # Posts list (/posts)
│   └── [id]/
│       └── page.tsx          # Single post (/posts/:id)
└── api/
    └── posts/
        └── route.ts          # API endpoint (/api/posts)
```

## Special Files

Pastoria recognizes several special files within the `pastoria/` directory:

### `page.tsx`

Defines a routable page component. Every route needs a `page.tsx` file. See
[Pages](./pages.md) for details.

```tsx
// pastoria/about/page.tsx
export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

### `*.page.tsx` (Nested Entry Points)

Files matching `*.page.tsx` (like `sidebar.page.tsx` or `results.page.tsx`)
define nested entry points that can be loaded alongside the main page. See
[Nested Entry Points](./nested-entrypoints.md) for details.

```
pastoria/search/
├── page.tsx               # Main search page
└── results.page.tsx       # Nested results component
```

### `(name).page.tsx` (Optional Entry Points)

Wrapping the name in parentheses makes a nested entry point optional. The parent
can choose whether to load it based on route parameters.

```
pastoria/hello/[name]/
├── page.tsx               # Main page
├── (banner).page.tsx      # Optional: only loaded conditionally
└── results.page.tsx       # Required: always loaded
```

### `entrypoint.ts`

Provides custom configuration for a route's preloading behavior. Use this when
you need to transform parameters or conditionally load entry points. See
[Custom Entry Points](./custom-entrypoints.md) for details.

```tsx
// pastoria/posts/[id]/entrypoint.ts
export const schema = z.object({
  id: z.string().transform(decodeURIComponent),
});

export default function getPreloadProps({params, queries, entryPoints}) {
  return {
    queries: {
      postQuery: queries.postQuery({id: params.id}),
    },
    entryPoints: {},
  };
}
```

### `app.tsx`

Defines an optional root layout that wraps all pages. See
[Root Layout](./root-layout.md) for details.

```tsx
// pastoria/app.tsx
export default function App({children}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### `environment.ts`

Configures the GraphQL environment including schema and context. See
[Environment Configuration](./environment-config.md) for details.

```tsx
// pastoria/environment.ts
export default new PastoriaEnvironment({
  schema: getSchema(),
  createContext: async (req) => new Context(),
});
```

### `route.ts`

Defines API endpoints using Express routers. See [API Routes](./api-routes.md)
for details.

```tsx
// pastoria/api/posts/route.ts
const router = express.Router();
router.get('/', async (req, res) => {
  res.json({posts: await db.posts.findMany()});
});
export default router;
```

## Dynamic Routes

Create dynamic route segments by wrapping folder names in square brackets:

```
pastoria/posts/[id]/page.tsx     →  /posts/:id
pastoria/users/[userId]/page.tsx →  /users/:userId
```

The parameter value is available via route props:

```tsx
// pastoria/posts/[id]/page.tsx
export default function PostPage({queries}: PageProps<'/posts/[id]'>) {
  // Route parameter 'id' is automatically passed to queries
}
```

### Multiple Dynamic Segments

You can have multiple dynamic segments:

```
pastoria/users/[userId]/posts/[postId]/page.tsx
→ /users/:userId/posts/:postId
```

## Query Parameters

Search/query parameters (like `?q=search`) are handled separately from route
parameters. By default, both route parameters and search parameters are merged
and passed to GraphQL queries as variables.

```tsx
// For URL: /search?q=hello&page=2
// Both q and page are available as query variables
```

Use a custom `entrypoint.ts` if you need more control over parameter handling.

## Code Generation

After modifying the `pastoria/` directory structure, run the code generator:

```bash
pnpm generate
```

This command (typically `relay-compiler && pastoria generate`) scans your
filesystem routes and generates:

- `__generated__/router/router.tsx` - Client-side router configuration
- `__generated__/router/types.ts` - `PageProps<Route>` type definitions
- `__generated__/router/js_resource.ts` - Resource loaders for code splitting

## Route Matching

Pastoria matches routes in this order:

1. **Static segments** are matched before dynamic segments
2. **More specific routes** are matched before less specific ones

For example, with these routes:

```
pastoria/posts/page.tsx         # /posts
pastoria/posts/new/page.tsx     # /posts/new
pastoria/posts/[id]/page.tsx    # /posts/:id
```

- `/posts` → matches `pastoria/posts/page.tsx`
- `/posts/new` → matches `pastoria/posts/new/page.tsx`
- `/posts/123` → matches `pastoria/posts/[id]/page.tsx`

## Next Steps

- Learn about [page components](./pages.md) and the `queries` export pattern
- Understand [nested entry points](./nested-entrypoints.md) for complex layouts
- Configure custom preloading with
  [custom entry points](./custom-entrypoints.md)
- Set up a [root layout](./root-layout.md) for your application
- Create [API routes](./api-routes.md) for backend endpoints
