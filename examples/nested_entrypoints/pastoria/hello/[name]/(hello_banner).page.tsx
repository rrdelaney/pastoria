import HelloBannerQuery from '#genfiles/queries/HelloBannerQuery.graphql';
import type {PageProps} from '#genfiles/router/types';
import {graphql, usePreloadedQuery} from 'react-relay';

export const queries = {
  helloBannerRef: HelloBannerQuery,
};

export default function HelloBanner({
  queries,
}: PageProps<'/hello/[name]#hello_banner'>) {
  const {helloMessage} = usePreloadedQuery(
    graphql`
      query HelloBannerQuery @preloadable @throwOnFieldError {
        helloMessage
      }
    `,
    queries.helloBannerRef,
  );

  return <div className="mb-10">{helloMessage}</div>;
}
