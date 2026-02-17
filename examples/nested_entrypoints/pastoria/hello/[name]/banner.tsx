import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  helloBannerRef: banner_HelloBannerQuery;
};

export default function HelloBanner({queries}) {
  const {helloMessage} = usePreloadedQuery(
    graphql`
      query banner_HelloBannerQuery @preloadable @throwOnFieldError {
        helloMessage
      }
    `,
    queries.helloBannerRef,
  );

  return <div className="mb-10">{helloMessage}</div>;
}
