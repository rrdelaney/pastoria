import express from 'express';
import {GraphQLSchema, graphql} from 'graphql';
import {ComponentType, PropsWithChildren} from 'react';
import {renderToPipeableStream} from 'react-dom/server';
import {
  createOperationDescriptor,
  GraphQLResponse,
  GraphQLSingularResponse,
  OperationDescriptor,
  PayloadData,
  PreloadableQueryRegistry,
} from 'relay-runtime';
import serialize from 'serialize-javascript';
import type {Manifest} from 'vite';
import {
  AnyPreloadedEntryPoint,
  AnyPreloadedQuery,
  EnvironmentProvider,
  RouterOps,
} from '../relay_client_environment.js';
import {createServerEnvironment} from './relay_server_environment.js';

type SrcOfModuleId = (id: string) => string | null;
type AppComponent = ComponentType<PropsWithChildren<{}>>;
type RouterRootComponent = ComponentType<{
  preloadModules?: string[];
  preloadStylesheets?: string[];
  App?: AppComponent | null;
}>;
type CreateRouterRootFn = (
  initialEntryPoint: AnyPreloadedEntryPoint | null,
  provider: EnvironmentProvider,
  initialPath?: string,
) => RouterRootComponent;
type LoadEntryPointFn = (
  provider: EnvironmentProvider,
  initialPath?: string,
) => Promise<AnyPreloadedEntryPoint | null>;
type CreateContextFn = (req: Request) => unknown;

function createGraphqlHandler(
  schema: GraphQLSchema,
  createContext: CreateContextFn,
  persistedQueries: Record<string, string>,
): express.Handler {
  return async (req, res) => {
    try {
      let query: string | undefined;
      let id: string | undefined;
      let variables: Record<string, any> | undefined;
      let extensions: Record<string, any> | undefined;
      let operationName: string | undefined;

      // Parse parameters based on request method
      if (req.method === 'GET') {
        // GET request: parse from query string
        query = req.query.query as string | undefined;
        id = req.query.id as string | undefined;
        operationName = req.query.operationName as string | undefined;

        // Parse JSON-encoded variables and extensions
        if (req.query.variables) {
          try {
            variables = JSON.parse(req.query.variables as string);
          } catch (e) {
            res.status(400).json({
              errors: [{message: 'Invalid variables JSON'}],
            });
            return;
          }
        }

        if (req.query.extensions) {
          try {
            extensions = JSON.parse(req.query.extensions as string);
          } catch (e) {
            res.status(400).json({
              errors: [{message: 'Invalid extensions JSON'}],
            });
            return;
          }
        }
      } else {
        // POST request: parse from body
        ({query, id, variables, extensions, operationName} = req.body);
      }

      // Resolve the query source (support persisted queries)
      let source = query;
      if (source == null && id != null) {
        source = persistedQueries[id] ?? null;
      }

      if (source == null) {
        res.status(400).json({
          errors: [{message: 'No query provided'}],
        });
        return;
      }

      // Create context for this request
      const contextValue = createContext(req as any);

      // Execute the GraphQL query
      const result = await graphql({
        schema,
        source,
        contextValue,
        variableValues: variables,
        operationName,
      });

      // Return the result
      res.json(result);
    } catch (error) {
      console.error('GraphQL handler error:', error);
      res.status(500).json({
        errors: [{message: 'Internal server error'}],
      });
    }
  };
}

function createReactHandler(
  srcOfModuleId: SrcOfModuleId,
  loadEntryPoint: LoadEntryPointFn,
  createAppFromEntryPoint: CreateRouterRootFn,
  App: AppComponent | null,
  schema: GraphQLSchema,
  createContext: CreateContextFn,
  persistedQueries: Record<string, string>,
  manifest?: Manifest | null,
): express.Handler {
  return async (req, res) => {
    const context = createContext(null!);
    const provider = createServerEnvironment(
      req,
      schema,
      persistedQueries,
      context,
    );

    const ep = await loadEntryPoint(provider, req.originalUrl);
    const ops = ep == null ? [] : await loadQueries(ep);
    const RouterApp = createAppFromEntryPoint(ep, provider, req.originalUrl);

    const {
      preloadModules,
      preloadStylesheets,
      bootstrapScriptContent,
      bootstrapModules,
    } = bootstrapScripts(srcOfModuleId, ep, ops, manifest);

    const {pipe} = renderToPipeableStream(
      <RouterApp
        App={App}
        preloadModules={preloadModules}
        preloadStylesheets={preloadStylesheets}
      />,
      {
        bootstrapScriptContent,
        bootstrapModules,
        onShellReady() {
          res.setHeader('Content-Type', 'text/html');
          pipe(res);
        },
      },
    );
  };
}

export function createRouterHandler(
  routes: string[],
  srcOfModuleId: SrcOfModuleId,
  loadEntryPoint: LoadEntryPointFn,
  createAppFromEntryPoint: CreateRouterRootFn,
  App: AppComponent | null,
  schema: GraphQLSchema,
  createContext: CreateContextFn,
  persistedQueries: Record<string, string>,
  manifest?: Manifest | null,
): express.Router {
  const r = express.Router();

  const graphqlHandler = createGraphqlHandler(
    schema,
    createContext,
    persistedQueries,
  );

  // Support both GET and POST for GraphQL endpoint
  r.get('/api/graphql', graphqlHandler);
  r.post('/api/graphql', express.json(), graphqlHandler);

  r.get(
    routes,
    createReactHandler(
      srcOfModuleId,
      loadEntryPoint,
      createAppFromEntryPoint,
      App,
      schema,
      createContext,
      persistedQueries,
      manifest,
    ),
  );

  return r;
}

async function loadQueries(entryPoint: AnyPreloadedEntryPoint) {
  const preloadedQueryOps: [OperationDescriptor, PayloadData][] = [];
  for (const query of Object.values(
    entryPoint?.queries ?? {},
  ) as AnyPreloadedQuery[]) {
    try {
      const payload = await ensureQueryFlushed(query);
      const concreteRequest =
        query.id == null ? null : PreloadableQueryRegistry.get(query.id);

      if (concreteRequest != null) {
        const desc = createOperationDescriptor(
          concreteRequest,
          query.variables,
        );

        preloadedQueryOps.push([
          desc,
          (payload as GraphQLSingularResponse).data!,
        ]);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return preloadedQueryOps;
}

async function ensureQueryFlushed(
  query: AnyPreloadedQuery,
): Promise<GraphQLResponse> {
  return new Promise((resolve, reject) => {
    if (query.source == null) {
      resolve({data: {}});
    } else {
      query.source.subscribe({
        next: resolve,
        error: reject,
      });
    }
  });
}

interface RouterBootstrap {
  preloadModules: string[];
  preloadStylesheets: string[];
  bootstrapScriptContent: string;
  bootstrapModules: string[];
}

function bootstrapScripts(
  srcOfModuleId: SrcOfModuleId,
  entryPoint: AnyPreloadedEntryPoint | null,
  ops: RouterOps,
  manifest?: Manifest | null,
): RouterBootstrap {
  const bootstrap: RouterBootstrap = {
    preloadModules: [],
    preloadStylesheets: [],
    bootstrapModules: [],
    bootstrapScriptContent: `window.__router_ops = ${serialize(ops)};`,
  };

  function crawlImports(moduleName: string) {
    const chunk = manifest?.[moduleName];
    if (!chunk) return;

    chunk.imports?.forEach(crawlImports);
    bootstrap.preloadModules.push('/' + chunk.file);
    if (chunk?.css) {
      bootstrap.preloadStylesheets.push(...chunk.css.map((css) => '/' + css));
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    bootstrap.preloadStylesheets.push('/src/globals.css');
    bootstrap.bootstrapModules.push(
      '/@vite/client',
      '/@id/virtual:pastoria-entry-client.tsx',
    );
  } else if (entryPoint != null) {
    const rootModuleSrc = srcOfModuleId(entryPoint.rootModuleID);
    if (rootModuleSrc == null) return bootstrap;

    const mainChunk = manifest?.[rootModuleSrc];
    if (mainChunk) {
      bootstrap.bootstrapModules.push('/' + mainChunk.file);
    }

    crawlImports(rootModuleSrc);
  }

  return bootstrap;
}
