import type {Request} from 'express';
import type {GraphQLSchema} from 'graphql';

export interface PastoriaEnvironmentConfig {
  /**
   * The GraphQL schema for the application.
   * This schema will be used for both the GraphQL API endpoint
   * and the Relay server environment during SSR.
   */
  schema: GraphQLSchema;

  /**
   * Factory function to create a context for each request.
   * The context is passed to GraphQL resolvers and is available
   * throughout the request lifecycle.
   *
   * @param req - The Express request object
   * @returns The context object, or a promise that resolves to it
   */
  createContext: (req: Request) => unknown | Promise<unknown>;

  /**
   * Enable GraphiQL interface in production.
   * By default, GraphiQL is only available in development mode.
   * Set to true to enable it in production as well.
   *
   * @default false
   */
  enableGraphiQLInProduction?: boolean;

  /**
   * Only allow persisted queries to be executed in production.
   * When true, plain text GraphQL queries will be rejected in production.
   * This improves security and enables optimizations like GraphQL-JIT.
   * In development mode, plain text queries are always allowed (for GraphiQL).
   *
   * @default false
   */
  persistedQueriesOnlyInProduction?: boolean;
}

/**
 * Configuration class for Pastoria applications.
 *
 * Create an instance of this class in `pastoria/environment.ts` to configure
 * how Pastoria creates GraphQL APIs and Relay environments.
 *
 * @example
 * ```typescript
 * // pastoria/environment.ts
 * import {PastoriaEnvironment} from 'pastoria-runtime/server';
 * import {getSchema} from '../src/schema';
 * import {Context} from '../src/context';
 *
 * export default new PastoriaEnvironment({
 *   schema: getSchema(),
 *   createContext: async (req) => {
 *     return Context.createFromRequest(req);
 *   },
 * });
 * ```
 */
export class PastoriaEnvironment {
  public readonly schema: GraphQLSchema;
  public readonly createContext: (req: Request) => unknown | Promise<unknown>;
  public readonly enableGraphiQLInProduction: boolean;
  public readonly persistedQueriesOnlyInProduction: boolean;

  constructor(config: PastoriaEnvironmentConfig) {
    this.schema = config.schema;
    this.createContext = config.createContext;
    this.enableGraphiQLInProduction =
      config.enableGraphiQLInProduction ?? false;
    this.persistedQueriesOnlyInProduction =
      config.persistedQueriesOnlyInProduction ?? false;
  }
}
