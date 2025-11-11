import {ModuleType} from '#genfiles/router/js_resource.js';
import {useNavigation, useRouteParams} from '#genfiles/router/router.jsx';
import {Suspense, useEffect, useState} from 'react';
import {
  EntryPoint,
  EntryPointComponent,
  EntryPointContainer,
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
