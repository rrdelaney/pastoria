---
sidebar_position: 4
---

# Styling and UI Conventions

The starter ships with TailwindCSS and a minimal example layout to keep you productive from
day one. This guide outlines how global styles are wired up and how to extend them.

## Global CSS entry point

`src/app_root.tsx` imports `./globals.css` so Tailwind styles are available to every page.
The root component wraps the rendered application in semantic HTML tags and sets the base
metadata:

```tsx
export function AppRoot({children}: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pastoria Starter</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Add any additional meta tags, fonts, or analytics scripts in this component.

## Tailwind usage

The home page demonstrates Tailwind utility classes for layout and typography:

```tsx
export function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">Welcome to Pastoria!</h1>
        <p className="mt-4 text-gray-300">It's like the darkness in the light</p>
      </div>
    </div>
  );
}
```

Modify `globals.css` to add project-specific tokens or drop in another styling solution if
you prefer.

## Adding design systems

Because the project is a standard React + Vite setup, you can install component libraries or
CSS-in-JS solutions alongside Tailwind. Remove unused tooling by editing `package.json` and
updating the relevant build plugins if you switch approaches.
