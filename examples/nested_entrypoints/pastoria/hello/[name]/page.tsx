import page_HelloQuery from '#genfiles/queries/page_HelloQuery.graphql';
import type {PageProps} from '#genfiles/router/types';
import {useNavigation, useRouteParams} from '#genfiles/router/router.jsx';
import {Suspense, useEffect, useState} from 'react';
import {EntryPointContainer, graphql, usePreloadedQuery} from 'react-relay';

export const queries = {
  nameQuery: page_HelloQuery,
};

export default function HelloWorld({
  queries,
  entryPoints,
}: PageProps<'/hello/[name]'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query page_HelloQuery($name: String!) @preloadable @throwOnFieldError {
        greet(name: $name)
      }
    `,
    queries.nameQuery,
  );

  const {name, q} = useRouteParams('/hello/[name]');
  const [search, setSearch] = useState(q ?? '');

  const {replaceRoute} = useNavigation();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      replaceRoute('/hello/[name]', {name, q: !!search ? search : null});
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-36">
      {/* hello_banner is optional - check if it exists before rendering */}
      {entryPoints.hello_banner && (
        <EntryPointContainer
          entryPointReference={entryPoints.hello_banner}
          props={{}}
        />
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`${greet} Search for cities...`}
        className="min-w-lg mb-24 rounded-lg border border-gray-400 p-4"
      />

      <Suspense fallback="Loading...">
        <EntryPointContainer
          entryPointReference={entryPoints.hello_results}
          props={{}}
        />
      </Suspense>
    </div>
  );
}
