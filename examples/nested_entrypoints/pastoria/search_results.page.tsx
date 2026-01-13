import searchResults_Query from '#genfiles/queries/searchResults_Query.graphql';
import type {PageProps} from '#genfiles/router/types';
import {graphql, usePreloadedQuery} from 'react-relay';

export const queries = {
  citiesQueryRef: searchResults_Query,
};

export default function SearchResults({
  queries,
}: PageProps<'/#search_results'>) {
  const {cities} = usePreloadedQuery(
    graphql`
      query searchResults_Query($query: String)
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
      {cities?.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
}
