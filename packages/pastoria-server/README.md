# pastoria-server

`pastoria-server` is the reference Express host for serving a compiled Pastoria application. It loads the client and server bundles produced by `pastoria build`, wires up persisted GraphQL queries, and registers middleware such as `cookie-parser` needed for session-aware requests.

Run it directly for production deployments or adapt its setup for custom hosting environments. Deployment notes and customization guides are documented at [pastoria.org](https://pastoria.org).
