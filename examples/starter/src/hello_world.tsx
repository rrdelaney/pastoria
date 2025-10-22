import {helloWorld_HelloQuery} from '#genfiles/queries/helloWorld_HelloQuery.graphql.js';
import {EntryPointComponent, graphql, usePreloadedQuery} from 'react-relay';

/**
 * @route /hello/:name
 * @resource m#hello
 * @param {string} name
 * @query {helloWorld_HelloQuery} nameQuery
 */
export const HelloWorldPage: EntryPointComponent<
  {nameQuery: helloWorld_HelloQuery},
  {}
> = ({queries}) => {
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">{greet}</h1>
      </div>
    </div>
  );
};
