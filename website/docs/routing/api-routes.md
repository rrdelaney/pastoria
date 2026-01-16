---
sidebar_position: 6
---

# API Routes

API routes let you create backend endpoints alongside your pages. Define them
using `route.ts` files in the `pastoria/` directory, and Pastoria will mount
them as Express routes.

## Basic Usage

Create a `route.ts` file that exports an Express router:

```tsx
// pastoria/api/posts/route.ts
import express from 'express';

const router = express.Router();

router.use(express.json());

router.get('/', async (req, res) => {
  const posts = await db.posts.findMany();
  res.json({posts});
});

router.post('/', async (req, res) => {
  const post = await db.posts.create(req.body);
  res.status(201).json({post});
});

export default router;
```

This creates endpoints at:

- `GET /api/posts` - List all posts
- `POST /api/posts` - Create a new post

## Route Path Mapping

The file path determines the API route path:

| File Path                          | API Route         |
| ---------------------------------- | ----------------- |
| `pastoria/api/posts/route.ts`      | `/api/posts`      |
| `pastoria/api/users/route.ts`      | `/api/users`      |
| `pastoria/api/auth/login/route.ts` | `/api/auth/login` |
| `pastoria/api/posts/[id]/route.ts` | `/api/posts/:id`  |

## Dynamic Parameters

Use bracket syntax for dynamic route segments:

```tsx
// pastoria/api/posts/[id]/route.ts
import express from 'express';

const router = express.Router({mergeParams: true});

router.use(express.json());

router.get('/', async (req, res) => {
  const {id} = req.params;
  const post = await db.posts.findUnique({where: {id}});

  if (!post) {
    return res.status(404).json({error: 'Post not found'});
  }

  res.json({post});
});

router.put('/', async (req, res) => {
  const {id} = req.params;
  const post = await db.posts.update({
    where: {id},
    data: req.body,
  });
  res.json({post});
});

router.delete('/', async (req, res) => {
  const {id} = req.params;
  await db.posts.delete({where: {id}});
  res.status(204).send();
});

export default router;
```

**Important:** Use `{mergeParams: true}` when creating the router to access
parameters from the URL path.

## Multiple Dynamic Segments

You can have multiple dynamic segments:

```tsx
// pastoria/api/users/[userId]/posts/[postId]/route.ts
import express from 'express';

const router = express.Router({mergeParams: true});

router.get('/', async (req, res) => {
  const {userId, postId} = req.params;
  const post = await db.posts.findFirst({
    where: {id: postId, authorId: userId},
  });
  res.json({post});
});

export default router;
```

This creates `/api/users/:userId/posts/:postId`.

## HTTP Methods

Express routers support all HTTP methods:

```tsx
const router = express.Router();

router.get('/', handleGet); // GET /api/resource
router.post('/', handlePost); // POST /api/resource
router.put('/', handlePut); // PUT /api/resource
router.patch('/', handlePatch); // PATCH /api/resource
router.delete('/', handleDelete); // DELETE /api/resource
router.options('/', handleOptions); // OPTIONS /api/resource
```

## Request Body Parsing

Add middleware for parsing request bodies:

```tsx
const router = express.Router();

// Parse JSON bodies
router.use(express.json());

// Parse URL-encoded bodies
router.use(express.urlencoded({extended: true}));

router.post('/', (req, res) => {
  console.log(req.body); // Parsed body
  res.json({received: req.body});
});
```

## Query Parameters

Access query parameters via `req.query`:

```tsx
// GET /api/posts?page=2&limit=10
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const posts = await db.posts.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  res.json({posts, page, limit});
});
```

## Catch-All Routes

Use Express's wildcard routing for catch-all patterns:

```tsx
// pastoria/api/auth/route.ts
import express from 'express';
import {authHandler} from './auth-handler';

const router = express.Router();

router.use(express.json());

// Catch all routes under /api/auth/*
router.use('*path', async (req, res) => {
  await authHandler(req, res);
});

export default router;
```

This is useful for integrating authentication libraries like Better Auth that
handle multiple routes.

## Middleware

Add middleware to your routes:

```tsx
import express from 'express';
import cors from 'cors';

const router = express.Router();

// CORS middleware
router.use(
  cors({
    origin: 'https://myapp.com',
    credentials: true,
  }),
);

// Logging middleware
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({error: 'Unauthorized'});
  }
  next();
};

router.get('/protected', requireAuth, (req, res) => {
  res.json({secret: 'data'});
});

export default router;
```

## Error Handling

Handle errors in your routes:

```tsx
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const post = await db.posts.findUnique({
      where: {id: req.params.id},
    });

    if (!post) {
      return res.status(404).json({error: 'Not found'});
    }

    res.json({post});
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});
```

Or use an error-handling middleware:

```tsx
const router = express.Router();

// Async error wrapper
const asyncHandler =
  (fn) =>
  (req, res, next): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const post = await db.posts.findUniqueOrThrow({
      where: {id: req.params.id},
    });
    res.json({post});
  }),
);

// Error handler
router.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({error: 'Internal server error'});
});

export default router;
```

## Accessing the GraphQL Context

API routes can access the same context used by GraphQL resolvers:

```tsx
// pastoria/api/me/route.ts
import express from 'express';
import environment from '../environment';

const router = express.Router();

router.get('/', async (req, res) => {
  const context = await environment.createContext(req);
  const user = context.getCurrentUser();

  if (!user) {
    return res.status(401).json({error: 'Not authenticated'});
  }

  res.json({user});
});

export default router;
```

## File Uploads

Handle file uploads with multer:

```tsx
import express from 'express';
import multer from 'multer';

const upload = multer({dest: 'uploads/'});
const router = express.Router();

router.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    filename: req.file.filename,
    path: req.file.path,
  });
});

export default router;
```

## Response Types

Return different response types:

```tsx
// JSON response
router.get('/json', (req, res) => {
  res.json({message: 'Hello'});
});

// Text response
router.get('/text', (req, res) => {
  res.type('text').send('Hello, World!');
});

// HTML response
router.get('/html', (req, res) => {
  res.type('html').send('<h1>Hello</h1>');
});

// File download
router.get('/download', (req, res) => {
  res.download('/path/to/file.pdf');
});

// Redirect
router.get('/redirect', (req, res) => {
  res.redirect('/api/other-route');
});
```

## Complete Example

Here's a complete CRUD API example:

```tsx
// pastoria/api/posts/route.ts
import express from 'express';
import {z} from 'zod';

const router = express.Router();
router.use(express.json());

// Validation schema
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

const updatePostSchema = createPostSchema.partial();

// List posts
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const posts = await db.posts.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {createdAt: 'desc'},
  });

  const total = await db.posts.count();

  res.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Create post
router.post('/', async (req, res) => {
  const result = createPostSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({error: result.error.issues});
  }

  const post = await db.posts.create({data: result.data});
  res.status(201).json({post});
});

export default router;
```

```tsx
// pastoria/api/posts/[id]/route.ts
import express from 'express';
import {z} from 'zod';

const router = express.Router({mergeParams: true});
router.use(express.json());

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
});

// Get single post
router.get('/', async (req, res) => {
  const post = await db.posts.findUnique({
    where: {id: req.params.id},
  });

  if (!post) {
    return res.status(404).json({error: 'Post not found'});
  }

  res.json({post});
});

// Update post
router.put('/', async (req, res) => {
  const result = updatePostSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({error: result.error.issues});
  }

  try {
    const post = await db.posts.update({
      where: {id: req.params.id},
      data: result.data,
    });
    res.json({post});
  } catch {
    res.status(404).json({error: 'Post not found'});
  }
});

// Delete post
router.delete('/', async (req, res) => {
  try {
    await db.posts.delete({where: {id: req.params.id}});
    res.status(204).send();
  } catch {
    res.status(404).json({error: 'Post not found'});
  }
});

export default router;
```

## Next Steps

- Configure your [GraphQL environment](./environment-config.md)
- Learn about [GraphQL queries](../graphql/graphql-queries.md) for data fetching
- Understand the [CLI commands](../cli/overview.md) for development
