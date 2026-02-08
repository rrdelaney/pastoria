# Pastoria

Pastoria is a full-stack JavaScript framework for building data-driven apps with React and Relay. It’s comparable to other React meta-frameworks with an emphasis on type-correctness and data interactivity.

Pastoria uses a file-system based router for defining pages rendered using React, and comes with a pre-configured GraphQL server. Pastoria doesn’t enforce a specific way to build a GraphQL schema, but it our starter kits recommend Grats.

Pastoria doesn’t support React server components or server functions. These feature are often redundant and overstep Relay’s data management. Pastoria uses Relay to dynamically load and render React components, with bundles created using Vite.