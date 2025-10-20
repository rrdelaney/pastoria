# pastoria-config

`pastoria-config` centralizes the configuration contract shared by Pastoria packages. It provides TypeScript types, schema validation, and a loader that reads the `pastoria` block in `package.json`, applying defaults for features such as GraphiQL availability and persisted query enforcement.

Use the helpers from custom tooling or server extensions to align configuration with the core framework behavior. Additional configuration reference material lives at [pastoria.org](https://pastoria.org).
