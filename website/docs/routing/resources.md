---
sidebar_position: 1
---

# Resources

Resources are Pastoria's system for code splitting and lazy loading. They allow
you to break your application into smaller chunks that are loaded on-demand,
improving initial load times and runtime performance.

## What is a Resource?

A resource is a module that can be lazy-loaded by Pastoria's code-splitting
system. Instead of bundling all your code together, resources enable you to load
only what's needed for the current route or interaction.

Think of a resource as a named export that Pastoria can load by its module ID
when needed.

## Defining Resources

Mark any exported component or value with the `@resource` JSDoc tag:

```tsx
/**
 * @resource m#home
 */
export function HomePage() {
  return (
    <div>
      <h1>Welcome to Pastoria!</h1>
    </div>
  );
}
```

**What the `@resource` tag does:**

1. **Registers the export** with a unique module ID (e.g., `m#home`)
2. **Enables code splitting** for that module
3. **Allows lazy-loading** via the module ID

### Module ID Conventions

The module ID is a unique identifier you choose:

- **Pattern**: `m#<descriptive_name>`
- **Examples**:
  - `m#home` - Homepage component
  - `m#user_profile` - User profile page
  - `m#post_editor` - Post editor component
  - `m#search_results` - Search results component

**Convention**: Use `m#` prefix followed by a snake_case name that matches your
component's purpose.

## What is JSResource?

`JSResource` is Pastoria's API for referencing lazy-loadable modules. Think of
it as a pointer to code that isn't loaded yet—a way to reference a module
without actually importing it.

### Creating Resource References

```tsx
import {JSResource} from '#genfiles/router/js_resource';

// Create a reference to the 'm#home' resource
const homeResource = JSResource.fromModuleId('m#home');
```

When you call `JSResource.fromModuleId('m#home')`, you're creating a reference
that Pastoria can use to:

1. **Determine what code to load** when navigating to a route
2. **Start loading in parallel** with other resources
3. **Preload resources** before they're actually needed

### How JSResource Enables Performance

JSResource unlocks several performance optimizations:

**Code Splitting** Only load the code needed for the current route. If a user
visits `/home`, they don't download the code for `/profile` or `/settings`.

**Parallel Loading** Start loading multiple resources simultaneously:

```tsx
// Both resources can load in parallel
const homeResource = JSResource.fromModuleId('m#home');
const sidebarResource = JSResource.fromModuleId('m#sidebar');
```

**Preloading** Begin loading resources before they're needed. Pastoria preloads
resources on the server so they're ready before rendering.

## Resources in Entrypoints

Resources are referenced in entrypoints using `JSResource.fromModuleId()`:

**From `examples/starter/src/home.entrypoint.tsx`:**

```tsx
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/** @route / */
export const entrypoint: EntryPoint<
  ModuleType<'m#home'>,
  EntryPointParams<'/'>
> = {
  root: JSResource.fromModuleId('m#home'), // Reference the resource
  getPreloadProps({}) {
    return {
      queries: {},
    };
  },
};
```

The `root` field tells Pastoria which resource to load and render for this
route.

## Resources vs Imports

**Traditional imports** load code immediately:

```tsx
import {HomePage} from './home'; // Code loads now

// HomePage is available immediately
<HomePage />;
```

**Resources** load code on-demand:

```tsx
/** @resource m#home */
export function HomePage() {
  /* ... */
}

// Reference it without loading
const homeResource = JSResource.fromModuleId('m#home');

// Code loads later when needed
```

This distinction is crucial for performance:

- Imports increase your initial bundle size
- Resources keep bundles small and load on-demand

## Resource-Driven vs Manual Entrypoints

Resources work seamlessly with both entrypoint patterns:

### Manual Entrypoints

Explicitly reference resources with `JSResource.fromModuleId()`:

```tsx
export const entrypoint: EntryPoint = {
  root: JSResource.fromModuleId('m#user_profile'),
  getPreloadProps({params}) {
    // ...
  },
};
```

### Resource-Driven Entrypoints

Use `@resource` and `@route` together—Pastoria generates the JSResource
reference automatically:

```tsx
/**
 * @route /users/:userId
 * @resource m#user_profile
 * @param {string} userId
 */
export const UserProfilePage: EntryPointComponent<
  {userQuery: UserProfileQuery},
  {}
> = ({queries}) => {
  // Pastoria auto-generates: JSResource.fromModuleId('m#user_profile')
};
```

## Nested Resources

Resources can reference other resources for nested component hierarchies.

**From `examples/nested_entrypoints/src/search.entrypoint.tsx`:**

```tsx
export const entrypoint: EntryPoint = {
  root: JSResource.fromModuleId('m#search'), // Parent resource
  getPreloadProps({params}) {
    return {
      queries: {},
      entryPoints: {
        searchResults: {
          entryPointParams: {},
          entryPoint: {
            root: JSResource.fromModuleId('m#search_results'), // Child resource
            getPreloadProps({}) {
              return {
                queries: {
                  /* ... */
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

This enables progressive loading:

1. Load parent component (`m#search`)
2. Render initial UI (search input)
3. Load child component (`m#search_results`) in the background
4. Render search results when ready

## Type Safety with ModuleType

Pastoria generates TypeScript types for your resources:

```tsx
import {ModuleType} from '#genfiles/router/js_resource';

// Type-safe resource reference
const entrypoint: EntryPoint<
  ModuleType<'m#home'>, // Type of the component for this resource
  EntryPointParams<'/'>
> = {
  root: JSResource.fromModuleId('m#home'),
  // ...
};
```

`ModuleType<'m#home'>` ensures type safety between your resource ID and the
actual component type.

## Resource Registration

When you run `pastoria gen`, Pastoria:

1. **Scans your codebase** for `@resource` tags
2. **Registers each resource** with its module ID
3. **Generates type-safe mappings** in `__generated__/router/js_resource.ts`
4. **Creates the resource loader** for code splitting

The generated file includes:

- `JSResource` class for creating references
- `ModuleType<>` types for type safety
- Resource registration mapping IDs to modules

## Best Practices

### Name Resources Descriptively

Use names that clearly describe the component's purpose:

```tsx
// ✅ Good - clear purpose
/** @resource m#user_settings */
/** @resource m#post_editor */
/** @resource m#checkout_form */

// ❌ Bad - unclear
/** @resource m#page1 */
/** @resource m#component */
/** @resource m#thing */
```

### One Resource Per Component

Keep resources focused on a single component or feature:

```tsx
// ✅ Good - single responsibility
/** @resource m#user_profile */
export const UserProfile = () => {
  /* ... */
};

// ❌ Bad - multiple unrelated exports
/** @resource m#stuff */
export const UserProfile = () => {
  /* ... */
};
export const PostList = () => {
  /* ... */
};
export const CommentForm = () => {
  /* ... */
};
```

### Use Resources for Route Components

Always mark route components as resources:

```tsx
// ✅ Required for routes
/**
 * @route /posts/:postId
 * @resource m#post_page
 */
export const PostPage: EntryPointComponent = () => {
  /* ... */
};
```

### Consider Bundle Size

Use resources to split large dependencies:

```tsx
// Split a heavy chart library into its own resource
/** @resource m#analytics_chart */
export const AnalyticsChart = () => {
  const Chart = require('heavy-chart-library'); // Only loads when needed
  return <Chart />;
};
```

## Summary

Resources provide:

- ✅ **Code splitting** - Load only what's needed
- ✅ **Lazy loading** - Defer loading until required
- ✅ **Parallel loading** - Load multiple resources simultaneously
- ✅ **Type safety** - Generated TypeScript types
- ✅ **Performance** - Smaller initial bundles, faster page loads

Resources are the foundation of Pastoria's routing system, enabling both
[manual entrypoints](./manual-entrypoints.md) and
[resource-driven entrypoints](./resource-driven-entrypoints.md) to achieve
optimal performance with code splitting.
