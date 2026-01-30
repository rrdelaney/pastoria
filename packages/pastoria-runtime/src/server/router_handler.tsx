import express from 'express';
import {
  DocumentNode,
  execute,
  GraphQLSchema,
  parse,
  specifiedRules,
  validate,
} from 'graphql';
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
import {z} from 'zod/v4-mini';
import {
  AnyPreloadedEntryPoint,
  AnyPreloadedQuery,
  EnvironmentProvider,
  PASTORIA_ID_EXTENSION,
  RouterOps,
} from '../relay_client_environment.js';
import {graphiqlScript} from './graphiql.js';
import {createServerEnvironment} from './relay_server_environment.js';
import {PastoriaEnvironment} from './environment.js';

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

const jsonSchema = z.record(z.string(), z.json());

const requestSchema = z.object({
  query: z.nullish(z.string()),
  operationName: z.pipe(
    z.nullish(z.string()),
    z.transform((op) => (!!op ? op : undefined)),
  ),
  variables: z.nullish(jsonSchema),
  extensions: z.nullish(jsonSchema),
});

function createAbortControllFromRes(res: express.Response): AbortController {
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  });

  return controller;
}

function createGraphqlHandler(
  environment: PastoriaEnvironment,
  persistedQueries: Record<string, string>,
): express.Handler {
  const parsedPersistedQueries: Record<string, DocumentNode> = {};
  for (const [id, doc] of Object.entries(persistedQueries)) {
    try {
      parsedPersistedQueries[id] = parse(doc);
    } catch (e) {
      console.error(`Could not parse persisted query: ${id}`);
      console.error(e);
    }
  }

  return async (req, res) => {
    const allowGraphiQL =
      process.env.NODE_ENV !== 'production' ||
      environment.enableGraphiQLInProduction;

    if (req.method === 'GET' && allowGraphiQL) {
      return res.status(200).send(graphiqlScript());
    } else if (req.method !== 'POST') {
      return res.sendStatus(404);
    }

    if (req.headers['content-type'] !== 'application/json') {
      return res
        .status(400)
        .send(`Unsupported Content-Type: ${req.headers['content-type']}`);
    }

    const requestDataResult = requestSchema.safeParse(req.body);
    if (requestDataResult.error != null) {
      return res.status(200).send({
        errors: requestDataResult.error.issues,
      });
    }

    let {
      query: querySource,
      extensions: queryExtensions,
      operationName,
      variables,
    } = requestDataResult.data;

    let requestDocument: DocumentNode;
    if (typeof queryExtensions?.[PASTORIA_ID_EXTENSION] === 'string') {
      const persistedQueryId = queryExtensions?.[PASTORIA_ID_EXTENSION];
      if (parsedPersistedQueries[persistedQueryId] == null) {
        return res
          .status(400)
          .send(`Unable to find persisted query: ${persistedQueryId}`);
      }

      requestDocument = parsedPersistedQueries[persistedQueryId];
    } else if (querySource == null) {
      return res.status(400).send('Query is required.');
    } else {
      // If persistedQueriesOnlyInProduction is enabled, reject plain text queries in production
      if (
        process.env.NODE_ENV === 'production' &&
        environment.persistedQueriesOnlyInProduction
      ) {
        return res.status(200).send({
          errors: [
            'Only persisted queries are allowed in production. Plain text queries are disabled.',
          ],
        });
      }

      try {
        requestDocument = parse(querySource);
      } catch (e) {
        return res.status(400).send(`Could not parse query: ${e}`);
      }
    }

    const validationErrors = validate(
      environment.schema,
      requestDocument,
      specifiedRules,
    );
    if (validationErrors.length) {
      return res
        .status(200)
        .send({errors: validationErrors.map((e) => e.toString())});
    }

    const controller = createAbortControllFromRes(res);
    const graphqlResponse = await execute({
      document: requestDocument,
      schema: environment.schema,
      operationName,
      contextValue: await environment.createContext(req),
      variableValues: variables,
      abortSignal: controller.signal,
    });

    graphqlResponse.errors?.forEach((err) => {
      console.error(err);
    });

    return res.status(200).send(graphqlResponse);
  };
}

function createReactHandler(
  srcOfModuleId: SrcOfModuleId,
  loadEntryPoint: LoadEntryPointFn,
  createAppFromEntryPoint: CreateRouterRootFn,
  App: AppComponent | null,
  environment: PastoriaEnvironment,
  persistedQueries: Record<string, string>,
  manifest?: Manifest | null,
): express.Handler {
  return async (req, res) => {
    const context = await environment.createContext(req);
    const provider = createServerEnvironment(
      req,
      environment.schema,
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
        onError(err, {componentStack}) {
          console.error(`Error at: ${componentStack}:`, err);
        },
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
  environment: PastoriaEnvironment,
  persistedQueries: Record<string, string>,
  manifest?: Manifest | null,
): express.Router {
  const graphqlHandler = createGraphqlHandler(environment, persistedQueries);

  const reactHandler = createReactHandler(
    srcOfModuleId,
    loadEntryPoint,
    createAppFromEntryPoint,
    App,
    environment,
    persistedQueries,
    manifest,
  );

  return express
    .Router()
    .use('/api/graphql', express.json(), graphqlHandler)
    .get(routes, reactHandler);
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

  for (const nestedEntry of Object.values(entryPoint.entryPoints)) {
    preloadedQueryOps.push(...(await loadQueries(nestedEntry)));
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

  function crawlEntryPoint(ep: AnyPreloadedEntryPoint) {
    const rootModuleSrc = srcOfModuleId(ep.rootModuleID);
    if (rootModuleSrc == null) return bootstrap;

    const mainChunk = manifest?.[rootModuleSrc];
    if (mainChunk) {
      bootstrap.bootstrapModules.push('/' + mainChunk.file);
    }

    crawlImports(rootModuleSrc);

    for (const nestedEntryPoint of Object.values(ep.entryPoints ?? {})) {
      crawlEntryPoint(nestedEntryPoint);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    bootstrap.preloadStylesheets.push('/pastoria/globals.css');
    bootstrap.bootstrapModules.push(
      '/@vite/client',
      '/@id/virtual:pastoria-entry-client.tsx',
    );
  } else if (entryPoint != null) {
    crawlEntryPoint(entryPoint);
  }

  if (manifest?.['virtual:pastoria-entry-client.tsx']) {
    bootstrap.bootstrapModules.push(
      '/' + manifest['virtual:pastoria-entry-client.tsx'].file,
    );
  }

  return bootstrap;
}
