---
sidebar_position: 4
---

# Client-Side Navigation

Pastoria generates a type-safe router with navigation hooks and link components.
All navigation APIs are imported from the generated router module.

## Navigation hooks

The `useNavigation` hook provides programmatic navigation functions:

```tsx
import {useNavigation} from '#genfiles/router/router';

function MyComponent() {
  const {push, replace, pushRoute, replaceRoute} = useNavigation();

  // Type-safe navigation with route ID and params
  pushRoute('/hello/[name]', {name: 'world'});
  replaceRoute('/search', {q: 'cities'});
}
```

### `pushRoute` and `replaceRoute`

These are the primary navigation functions. They accept a route ID (using
bracket notation) and a params object:

```tsx
// Path params are filled into the URL template
pushRoute('/users/[id]', {id: '123'});
// Result: navigates to /users/123

// Extra params beyond path params go into the query string
pushRoute('/search', {q: 'test', page: 2});
// Result: navigates to /search?q=test&page=2
```

**Important difference:** `replaceRoute` **merges** the provided params with the
current URL's params before navigating, while `pushRoute` uses only the provided
params. This makes `replaceRoute` ideal for updating individual filter values
without losing other params:

```tsx
// If the current URL is /search?q=cities&page=2
replaceRoute('/search', {page: 3});
// Result: /search?q=cities&page=3 (q is preserved from current URL)

pushRoute('/search', {page: 3});
// Result: /search?page=3 (q is dropped — only provided params are used)
```

### `push` and `replace`

For raw URL navigation without type-safe route matching. These accept a string
path, a `URL` object, or a callback that receives the current URL for mutation:

```tsx
push('/about');
replace('/search?q=cities');

// URL object
push(new URL('/about', window.location.origin));

// Callback — receives a mutable URL based on current location
push((url) => {
  url.searchParams.set('q', 'cities');
});
```

### `usePath`

Returns the current pathname:

```tsx
import {usePath} from '#genfiles/router/router';

function Breadcrumb() {
  const pathname = usePath();
  return <span>{pathname}</span>;
}
```

## Link components

### `<Link>`

A simple link component for raw URLs:

```tsx
import {Link} from '#genfiles/router/router';

<Link href="/about">About</Link>
<Link href="/hello/world">Hello</Link>
```

### `<RouteLink>`

A type-safe link component that uses route IDs:

```tsx
import {RouteLink} from '#genfiles/router/router';

<RouteLink route="/hello/[name]" params={{name: 'world'}}>
  Hello World
</RouteLink>

<RouteLink route="/users/[id]" params={{id: user.id}}>
  {user.name}
</RouteLink>
```

`RouteLink` provides TypeScript type checking for both the route ID and the
required params.

## Filter changes via URL

A common pattern is to keep sort and filter state in the URL. Changes use
`replaceRoute` to update params, which re-triggers `getPreloadProps` and fetches
new data:

```tsx
const {replaceRoute} = useNavigation();

function handleSortChange(value: string) {
  replaceRoute('/', {sortBy: value, timePeriod});
}
```

## Tab-based navigation

Tabs can be modeled as URL params with conditional entrypoints:

```tsx
const {replaceRoute} = useNavigation();

<button onClick={() => replaceRoute('/users/[id]', {id, tab: 'details'})}>
  Details
</button>
<button onClick={() => replaceRoute('/users/[id]', {id, tab: 'activity'})}>
  Activity
</button>
```

Combined with
[conditional entrypoint loading](./nested-entrypoints.md#conditional-loading),
this loads only the active tab's code and data.
