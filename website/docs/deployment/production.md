---
sidebar_position: 1
---

# Deploying to Production

Pastoria apps are Node.js servers. After building, you deploy the output to any
platform that runs Node.js.

## Build the app

```bash
# Run code generation and build
pnpm generate
pnpm build
```

This produces two directories:

- **`dist/client/`** — optimized JavaScript, CSS, and assets for the browser
- **`dist/server/`** — server-side rendering bundle for Node.js

The build also generates `__generated__/router/persisted_queries.json`, which
maps query IDs to query text for the GraphQL endpoint.

## Start the production server

```bash
NODE_ENV=production pastoria-server
```

The `pastoria-server` binary (from the `pastoria-server` package) starts an
Express server on **port 8000** that:

1. Loads environment variables from `.env` via
   [dotenv](https://github.com/motdotla/dotenv)
2. Reads `dist/client/.vite/manifest.json` for asset fingerprinting
3. Reads `__generated__/router/persisted_queries.json` for persisted queries
4. Imports the compiled server entry from `dist/server/`
5. Serves static files from `dist/client/`
6. Handles SSR for all routes and the GraphQL API at `/api/graphql`

## Required build artifacts

These files must be present at runtime:

| Artifact                                      | Purpose                                |
| --------------------------------------------- | -------------------------------------- |
| `dist/client/`                                | Static assets served to browsers       |
| `dist/client/.vite/manifest.json`             | Asset fingerprinting for preload hints |
| `dist/server/`                                | Server-side rendering bundle           |
| `__generated__/router/persisted_queries.json` | Persisted query ID to query text map   |

## Environment variables

Pastoria loads `.env` files automatically in production via `dotenv`. You can
use this for database credentials, API keys, or any runtime configuration your
resolvers need.

There are no Pastoria-specific environment variables. All framework
configuration is done through `PastoriaEnvironment` in `pastoria/environment.ts`
— see [Configuration Reference](../architecture/configuration.md).

## Deploying with Docker

Create a `Dockerfile` at your project root:

```dockerfile
FROM node:20-slim

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy build artifacts
COPY dist/ dist/
COPY __generated__/router/persisted_queries.json __generated__/router/persisted_queries.json

# Copy .env if needed
# COPY .env .env

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npx", "pastoria-server"]
```

Build and run:

```bash
# Build the app locally first
pnpm generate && pnpm build

# Build and run the Docker image
docker build -t my-app .
docker run -p 8000:8000 my-app
```

## Deploying to Fly.io

Create a `fly.toml`:

```toml
[build]

[http_service]
  internal_port = 8000
  force_https = true

[env]
  NODE_ENV = "production"
```

Then deploy:

```bash
pnpm generate && pnpm build
fly deploy
```

## Deploying to Railway

Railway auto-detects Node.js apps. Set these in your project settings:

- **Build command:** `pnpm generate && pnpm build`
- **Start command:** `NODE_ENV=production npx pastoria-server`
- **Port:** `8000`

## Production checklist

- [ ] `NODE_ENV=production` is set — this enables persisted-queries-only mode
      and disables GraphiQL
- [ ] `.env` file is configured with production credentials
- [ ] `pnpm generate && pnpm build` has been run
- [ ] All three required artifact paths exist (`dist/client/`, `dist/server/`,
      `__generated__/router/persisted_queries.json`)
- [ ] Port 8000 is exposed and accessible

## Next steps

- Learn how [server-side rendering](../architecture/ssr.md) works under the hood
- Review the [configuration reference](../architecture/configuration.md) for
  production settings like `persistedQueriesOnlyInProduction`
