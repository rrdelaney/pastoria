import {search_SearchResultsQuery} from '#genfiles/queries/search_SearchResultsQuery.graphql.js';
import {ModuleType} from '#genfiles/router/js_resource.js';
import {useNavigation, useRouteParams} from '#genfiles/router/router.jsx';
import {Suspense, useDeferredValue, useEffect, useState} from 'react';
import {
  EntryPoint,
  EntryPointComponent,
  EntryPointContainer,
  graphql,
  usePreloadedQuery,
} from 'react-relay';

/**
 * @resource m#search
 */
export const SearchPage: EntryPointComponent<
  {},
  {searchResults: EntryPoint<ModuleType<'m#search_results'>>}
> = ({entryPoints}) => {
  const {q} = useRouteParams('/');
  const [search, setSearch] = useState(q);

  const {replaceRoute} = useNavigation();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      replaceRoute('/', {q: search});
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
          entryPointReference={entryPoints.searchResults}
          props={{}}
        />
      </Suspense>
    </div>
  );
};

/**
 * @resource m#search_results
 */
export const SearchResults: EntryPointComponent<
  {citiesQueryRef: search_SearchResultsQuery},
  {}
> = ({queries}) => {
  const {cities} = usePreloadedQuery(
    graphql`
      query search_SearchResultsQuery($query: String!)
      @preloadable
      @throwOnFieldError {
        cities(query: $query) {
          name
        }
      }
    `,
    queries.citiesQueryRef,
  );

  return (
    <div className="grid w-full max-w-lg grid-cols-2 justify-items-center lg:grid-cols-3">
      {cities.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
};
