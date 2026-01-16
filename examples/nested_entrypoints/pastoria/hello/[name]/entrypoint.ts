/**
 * Custom entry point configuration for the /hello/[name] route.
 *
 * This file demonstrates how to customize the loading behavior of a route:
 * - Define a custom schema for URL parameter validation
 * - Transform parameters before passing to queries
 * - Conditionally load optional nested entry points
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
  // Example: only show the banner for name "ryan"
  const showBanner = params.name.toLowerCase() === 'ryan';

  return {
    queries: {
      // Example: transform the name parameter before passing to query
      nameQuery: queries.nameQuery({name: params.name + '!'}),
    },
    entryPoints: {
      // hello_banner is optional (defined as (hello_banner).page.tsx)
      // We can conditionally return undefined to skip loading it
      hello_banner: showBanner ? entryPoints.hello_banner({}) : undefined,
      hello_results: entryPoints.hello_results({q: params.q}),
    },
  };
}
