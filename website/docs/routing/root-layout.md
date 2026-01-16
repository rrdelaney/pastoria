---
sidebar_position: 5
---

# Root Layout

The root layout (`app.tsx`) is an optional file that wraps all pages in your
Pastoria application. Use it for global UI elements, providers, and metadata
that should appear on every page.

## Basic Usage

Create an `app.tsx` file in your `pastoria/` directory:

```tsx
// pastoria/app.tsx
import type {PropsWithChildren} from 'react';

export default function App({children}: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Pastoria App</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

The `children` prop contains the rendered page component for the current route.

## Global Styles

Import global CSS in your root layout:

```tsx
// pastoria/app.tsx
import type {PropsWithChildren} from 'react';
import './globals.css';

export default function App({children}: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My App</title>
      </head>
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
```

Pastoria uses Tailwind CSS by default, so you can use utility classes directly.

## Global Providers

Wrap your app with React context providers:

```tsx
// pastoria/app.tsx
import type {PropsWithChildren} from 'react';
import {ThemeProvider} from './providers/theme';
import {AuthProvider} from './providers/auth';

export default function App({children}: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My App</title>
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Common providers to include:

- Theme/dark mode providers
- Authentication context
- Analytics providers
- Error boundary components

## Metadata and Fonts

Add metadata, fonts, and external resources:

```tsx
// pastoria/app.tsx
import type {PropsWithChildren} from 'react';
import './globals.css';

export default function App({children}: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="My awesome Pastoria application" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <title>My Pastoria App</title>
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

## Persistent Layout Elements

Add UI elements that persist across page navigations:

```tsx
// pastoria/app.tsx
import type {PropsWithChildren} from 'react';
import {Header} from './components/Header';
import {Footer} from './components/Footer';

export default function App({children}: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My App</title>
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**Note:** Unlike nested entry points, the root layout component does not support
GraphQL queries. For data-dependent global UI, use nested entry points on
individual pages or client-side data fetching.

## Error Boundaries

Add a global error boundary:

```tsx
// pastoria/app.tsx
import type {PropsWithChildren} from 'react';
import {ErrorBoundary} from 'react-error-boundary';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
    </div>
  );
}

export default function App({children}: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My App</title>
      </head>
      <body>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## Without a Root Layout

If you don't create an `app.tsx`, Pastoria renders pages without a wrapper. Each
page is responsible for its own `<html>` and `<head>` elements if needed.

This is useful for:

- Simple applications
- When pages have completely different layouts
- Migrating from other frameworks

## Limitations

The root layout has some limitations:

1. **No GraphQL queries** - The root layout doesn't support the `queries` export
   pattern. Use nested entry points for data-dependent UI.

2. **No route parameters** - The root layout doesn't receive route parameters.
   Individual pages handle route-specific logic.

3. **Always renders** - The root layout renders on every page. For
   route-specific layouts, use nested entry points within each page.

## Complete Example

Here's a comprehensive root layout example:

```tsx
// pastoria/app.tsx
import type {PropsWithChildren} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {ThemeProvider} from './providers/theme';
import {Header} from './components/Header';
import {Footer} from './components/Footer';
import './globals.css';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Something went wrong
        </h1>
        <p className="mt-2 text-gray-600">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

export default function App({children}: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="My Pastoria application" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <title>My Pastoria App</title>
      </head>
      <body className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900">
        <ThemeProvider>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Next Steps

- Learn about [API routes](./api-routes.md) for backend endpoints
- Explore [environment configuration](./environment-config.md) for GraphQL setup
- Understand [pages](./pages.md) and the query preloading pattern
