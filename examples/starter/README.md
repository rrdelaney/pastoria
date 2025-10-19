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

TODO(ryan): Document this with entry points.

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

3. Use it in a component with Relay:

```tsx
import {useLazyLoadQuery, graphql} from 'react-relay';

function MyComponent() {
  // TODO(ryan): This should use a preloaded query.
  const data = useLazyLoadQuery(
    graphql`
      query MyComponentQuery {
        myQuery
      }
    `,
    {},
  );

  return <div>{data.myQuery}</div>;
}
```

4. Regenerate Relay artifacts:

```bash
npm run generate:relay
```

## Learn More

- [Pastoria Documentation](https://pastoria.dev)
- [Relay Documentation](https://relay.dev)
- [Grats Documentation](https://grats.capt.dev)
- [React Documentation](https://react.dev)
