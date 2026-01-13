import {graphql, usePreloadedQuery} from 'react-relay';
import page_GreetQuery from '#genfiles/queries/page_GreetQuery.graphql';
import type {PageProps} from '#genfiles/router/types';

// Export queries to preload for this page
export const queries = {
  nameQuery: page_GreetQuery,
};

export default function HelloWorldPage({queries}: PageProps<'/hello/[name]'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query page_GreetQuery($name: String!)
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
}
