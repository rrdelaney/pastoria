import type {PageProps} from '#genfiles/router/types';
import {
  Link,
  RouteLink,
  useNavigation,
  useRouteParams,
} from '#genfiles/router/router.jsx';
import {Suspense, useEffect, useState} from 'react';
import {EntryPointContainer} from 'react-relay';

export default function SearchPage({entryPoints}: PageProps<'/'>) {
  const {query} = useRouteParams('/');
  const [search, setSearch] = useState(query ?? '');

  const {replaceRoute} = useNavigation();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      replaceRoute('/', {query: search});
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start pt-36">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for cities..."
        className="mb-24 min-w-lg rounded-lg border border-gray-400 p-4"
      />

      <Suspense fallback="Loading...">
        <EntryPointContainer
          entryPointReference={entryPoints.search_results}
          props={{}}
        />
      </Suspense>

      <div className="mt-12 flex gap-4">
        <RouteLink
          route="/greet/[[name]]"
          params={{name: undefined}}
          className="text-blue-500 underline hover:text-blue-700"
        >
          Try optional param: /greet
        </RouteLink>
        <RouteLink
          route="/greet/[[name]]"
          params={{name: 'World'}}
          className="text-blue-500 underline hover:text-blue-700"
        >
          Try optional param: /greet/World
        </RouteLink>
      </div>
    </div>
  );
}
