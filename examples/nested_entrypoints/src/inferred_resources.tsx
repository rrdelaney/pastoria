import {helloWorld_HelloCityResultsQuery} from '#genfiles/queries/helloWorld_HelloCityResultsQuery.graphql.js';
import {helloWorld_HelloQuery} from '#genfiles/queries/helloWorld_HelloQuery.graphql.js';
import {ModuleType} from '#genfiles/router/js_resource.js';
import {useNavigation, useRouteParams} from '#genfiles/router/router.jsx';
import {Suspense, useEffect, useState} from 'react';
import {
  EntryPoint,
  EntryPointComponent,
  EntryPointContainer,
  graphql,
  usePreloadedQuery,
} from 'react-relay';

/** @route /hello/:name */
export const HelloWorld: EntryPointComponent<
  {nameQuery: helloWorld_HelloQuery},
  {searchResults: EntryPoint<ModuleType<'m#hello_results'>>}
> = ({queries, entryPoints}) => {
  const {greet} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloQuery($name: String!)
      @preloadable
      @throwOnFieldError {
        greet(name: $name)
      }
    `,
    queries.nameQuery,
  );

  const {name, q} = useRouteParams('/hello/:name');
  const [search, setSearch] = useState(q ?? '');

  const {replaceRoute} = useNavigation();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      replaceRoute('/hello/:name', {name, q: !!search ? search : null});
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
        placeholder={`${greet} Search for cities...`}
        className="min-w-lg mb-24 rounded-lg border border-gray-400 p-4"
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

/** @resource m#hello_results */
export const HelloWorldCityResults: EntryPointComponent<
  {citiesQuery: helloWorld_HelloCityResultsQuery},
  {}
> = ({queries}) => {
  const {cities} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloCityResultsQuery($q: String)
      @preloadable
      @throwOnFieldError {
        cities(query: $q) {
          name
        }
      }
    `,
    queries.citiesQuery,
  );

  return (
    <div className="grid w-full max-w-lg grid-cols-2 justify-items-center lg:grid-cols-3">
      {cities.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
};
