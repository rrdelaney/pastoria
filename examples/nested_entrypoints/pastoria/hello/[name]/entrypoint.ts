/**
 * Custom entry point configuration for the /hello/[name] route.
 *
 * This file demonstrates how to customize the loading behavior of a route:
 * - Define a custom schema for URL parameter validation
 * - Conditionally load nested entry points based on parameters
 * - Transform parameters before passing to queries
 */

import type {EntryPointParams} from '#genfiles/router/router.jsx';
import type {PreloadPropsForRoute} from '#genfiles/router/types';
import * as z from 'zod/v4-mini';

export const schema = z.object({
  name: z.pipe(z.string(), z.transform(decodeURIComponent)),
  q: z.pipe(
    z.nullish(z.pipe(z.string(), z.transform(decodeURIComponent))),
    z.transform((s) => (s == null ? undefined : s)),
  ),
});

export default function getPreloadProps({
  params,
  queries,
  entryPoints,
}: EntryPointParams<'/hello/[name]'>): PreloadPropsForRoute<'/hello/[name]'> {
  // Custom logic: only load the banner for non-guest users
  const isGuest = params.name.toLowerCase() === 'guest';

  return {
    queries: {
      nameQuery: queries.nameQuery({name: params.name}),
    },
    entryPoints: {
      // Conditionally skip loading the banner for guest users
      ...(isGuest ? {} : {hello_banner: entryPoints.hello_banner({})}),
      hello_results: entryPoints.hello_results({q: params.q}),
    },
  };
}
