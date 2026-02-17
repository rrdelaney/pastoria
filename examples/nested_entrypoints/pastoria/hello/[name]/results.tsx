import {results_HelloCityResultsQuery} from '#genfiles/queries/results_HelloCityResultsQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  citiesQuery: results_HelloCityResultsQuery;
};

export default function HelloWorldCityResults({queries}) {
  const {cities} = usePreloadedQuery(
    graphql`
      query results_HelloCityResultsQuery($q: String)
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
}
