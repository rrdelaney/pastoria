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

  // Raw URL navigation
  push('/about');
  replace('/search?q=cities');
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

// replaceRoute replaces the current history entry instead of pushing
replaceRoute('/hello/[name]', {name: 'world', q: 'cities'});
// Result: replaces with /hello/world?q=cities
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
