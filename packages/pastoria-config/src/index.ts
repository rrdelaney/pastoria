/**
 * Configuration options for Pastoria framework.
 * These can be specified in the "pastoria" field of package.json.
 */
export interface PastoriaConfig {
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
 * Loads Pastoria configuration from package.json.
 * Returns default configuration if no config is found.
 */
export async function loadConfig(): Promise<Required<PastoriaConfig>> {
  const defaults: Required<PastoriaConfig> = {
    enableGraphiQLInProduction: false,
    persistedQueriesOnlyInProduction: false,
  };

  try {
    const {readFile} = await import('node:fs/promises');
    const packageJson = JSON.parse(await readFile('package.json', 'utf-8'));
    const userConfig = packageJson.pastoria ?? {};

    return {
      enableGraphiQLInProduction:
        userConfig.enableGraphiQLInProduction ??
        defaults.enableGraphiQLInProduction,
      persistedQueriesOnlyInProduction:
        userConfig.persistedQueriesOnlyInProduction ??
        defaults.persistedQueriesOnlyInProduction,
    };
  } catch (e) {
    // If package.json doesn't exist or can't be read, return defaults
    return defaults;
  }
}
