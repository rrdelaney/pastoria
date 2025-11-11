import {searchResults_SearchResultsQuery} from '#genfiles/queries/searchResults_SearchResultsQuery.graphql.js';
import {EntryPointComponent, graphql, usePreloadedQuery} from 'react-relay';

/**
 * @resource m#search_results
 */
export const SearchResults: EntryPointComponent<
  {citiesQueryRef: searchResults_SearchResultsQuery},
  {}
> = ({queries}) => {
  const {cities} = usePreloadedQuery(
    graphql`
      query searchResults_SearchResultsQuery($query: String!)
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
