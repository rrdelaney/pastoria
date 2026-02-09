import searchResults_SearchResultsQueryParameters from '#genfiles/queries/searchResults_SearchResultsQuery$parameters';
import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/**
 * @route /
 * @param {string?} q
 */
export const entrypoint: EntryPoint<
  ModuleType<'m#search'>,
  EntryPointParams<'/'>
> = {
  root: JSResource.fromModuleId('m#search'),
  getPreloadProps({q}) {
    return {
      queries: {},
      entryPoints: {
        searchResults: {
          entryPointParams: {},
          entryPoint: {
            root: JSResource.fromModuleId('m#search_results'),
            getPreloadProps({}) {
              return {
                queries: {
                  citiesQueryRef: {
                    parameters: searchResults_SearchResultsQueryParameters,
                    variables: {query: q ?? ''},
                  },
                },
              };
            },
          },
        },
      },
    };
  },
};
