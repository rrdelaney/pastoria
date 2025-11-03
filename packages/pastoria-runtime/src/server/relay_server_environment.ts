import {Request} from 'express';
import {graphql, GraphQLSchema} from 'graphql';
import {Environment, Network, RecordSource, Store} from 'relay-runtime';
import {
  EnvironmentProvider,
  RelayResolverContext,
} from '../relay_client_environment.js';

export function createServerEnvironment(
  req: Request,
  schema: GraphQLSchema,
  persistedQueries: Record<string, string>,
  contextValue: unknown,
): EnvironmentProvider {
  const network = Network.create(async (request, variables) => {
    let source = request.text;
    if (source == null && request.id) {
      source = persistedQueries?.[request.id] ?? null;
    }
    if (source == null) {
      throw new Error(`Could not find source for query: ${request.id}`);
    }

    // Remove all variables explicitly set to undefined to allow
    // application of default query variables.
    for (const key of Object.keys(variables)) {
      if (variables[key] === undefined) {
        delete variables[key];
      }
    }

    const results = await graphql({
      schema,
      source,
      contextValue,
      variableValues: variables,
    });

    return results as any;
  });

  const resolverContext: RelayResolverContext = {
    cookies: req.cookies,
  };

  const env = new Environment({
    network,
    store: new Store(new RecordSource(), {resolverContext}),
    isServer: true,
  });

  return {
    getEnvironment: () => env,
  };
}
