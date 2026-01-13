import helloBanner_Query from '#genfiles/queries/helloBanner_Query.graphql';
import type {PageProps} from '#genfiles/router/types';
import {graphql, usePreloadedQuery} from 'react-relay';

export const queries = {
  helloBannerRef: helloBanner_Query,
};

export default function HelloBanner({
  queries,
}: PageProps<'/hello/[name]#hello_banner'>) {
  const {helloMessage} = usePreloadedQuery(
    graphql`
      query helloBanner_Query @preloadable @throwOnFieldError {
        helloMessage
      }
    `,
    queries.helloBannerRef,
  );

  return <div className="mb-10">{helloMessage}</div>;
}
