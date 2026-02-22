import {banner_HelloBannerQuery} from '#genfiles/queries/banner_HelloBannerQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';

export type Queries = {
  helloBannerRef: banner_HelloBannerQuery;
};

export type RuntimeProps = {
  helloMessageSuffix: string;
};

export default function HelloBanner({
  queries,
  props,
}: PastoriaPageProps<'/hello/[name]#banner'>) {
  const {helloMessage} = usePreloadedQuery(
    graphql`
      query banner_HelloBannerQuery @preloadable @throwOnFieldError {
        helloMessage
      }
    `,
    queries.helloBannerRef,
  );

  return (
    <div className="mb-10">
      {helloMessage}
      {props.helloMessageSuffix}
    </div>
  );
}
