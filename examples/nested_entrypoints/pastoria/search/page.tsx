import {page_GreetQuery} from '#genfiles/queries/page_GreetQuery.graphql.js';
import {page_SearchResultsQuery} from '#genfiles/queries/page_SearchResultsQuery.graphql.js';
import {useNavigation} from '#genfiles/router/router.jsx';
import {Suspense, useEffect, useState} from 'react';
import {graphql, PreloadedQuery, usePreloadedQuery} from 'react-relay';

export type Queries = {
  bannerMessage: page_GreetQuery;
  searchResults: page_SearchResultsQuery;
};

export default function SearchResultsPage({
  queries,
}: PastoriaPageProps<'/search'>) {
  const {greet: greetingMessage} = usePreloadedQuery(
    graphql`
      query page_GreetQuery @preloadable @throwOnFieldError {
        greet(name: "Pastoria")
      }
    `,
    queries.bannerMessage,
  );

  const {q} = queries.searchResults.variables;
  const [search, setSearch] = useState(q ?? '');

  const {replaceRoute} = useNavigation();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      replaceRoute('/search', {q: !!search ? search : null});
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
        placeholder={greetingMessage}
        className="min-w-lg mb-24 rounded-lg border border-gray-400 p-4"
      />

      <Suspense fallback="Loading...">
        <SearchResults searchResultsQuery={queries.searchResults} />
      </Suspense>
    </div>
  );
}

function SearchResults({
  searchResultsQuery,
}: {
  searchResultsQuery: PreloadedQuery<page_SearchResultsQuery>;
}) {
  const {cities} = usePreloadedQuery(
    graphql`
      query page_SearchResultsQuery($q: String)
      @preloadable
      @throwOnFieldError {
        cities(query: $q) {
          name
        }
      }
    `,
    searchResultsQuery,
  );

  return (
    <div className="grid w-full max-w-lg grid-cols-2 justify-items-center lg:grid-cols-3">
      {cities.map((c) => (
        <div key={c.name}>{c.name}</div>
      ))}
    </div>
  );
}
