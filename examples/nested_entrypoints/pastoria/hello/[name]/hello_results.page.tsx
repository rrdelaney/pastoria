import helloResults_CityResultsQuery from '#genfiles/queries/helloResults_CityResultsQuery.graphql';
import type {PageProps} from '#genfiles/router/types';
import {graphql, usePreloadedQuery} from 'react-relay';

export const queries = {
  citiesQuery: helloResults_CityResultsQuery,
};

export default function HelloWorldCityResults({
  queries,
}: PageProps<'/hello/[name]#hello_results'>) {
  const {cities} = usePreloadedQuery(
    graphql`
      query helloResults_CityResultsQuery($q: String)
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
      {cities?.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
}
