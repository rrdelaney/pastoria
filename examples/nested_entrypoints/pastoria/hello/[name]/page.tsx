import {page_HelloQuery} from '#genfiles/queries/page_HelloQuery.graphql';
import {ModuleType} from '#genfiles/router/js_resource';
import {useNavigation, useRouteParams} from '#genfiles/router/router';
import {Suspense, useEffect, useState} from 'react';
import {
  EntryPoint,
  EntryPointContainer,
  graphql,
  usePreloadedQuery,
} from 'react-relay';
import {z} from 'zod/v4-mini';

export type Queries = {
  nameQuery: page_HelloQuery;
};

export type EntryPoints = {
  searchResults: EntryPoint<ModuleType<'/hello/[name]#results'>>;
  helloBanner: EntryPoint<ModuleType<'/hello/[name]#banner'>>;
};

export const schema = z.object({
  name: z.string(),
  q: z.nullish(z.string()),
});

export const getPreloadProps: GetPreloadProps<'/hello/[name]'> = ({
  queries,
  variables,
}) => {
  return {
    queries: {
      nameQuery: queries.nameQuery({name: variables.name}),
    },
    entryPoints: {
      helloBanner: null!,
      searchResults: null!,
    },
  };
};

export default function HelloWorldPage({
  queries,
  entryPoints,
}: PastoriaPageProps<'/hello/[name]'>) {
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
      <EntryPointContainer
        entryPointReference={entryPoints.helloBanner}
        props={{}}
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`${greet} Search for cities...`}
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
}
