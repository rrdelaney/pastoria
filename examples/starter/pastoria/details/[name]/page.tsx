import {graphql, usePreloadedQuery} from 'react-relay';
import {page_DetailsQuery} from '#genfiles/queries/page_DetailsQuery.graphql.js';

export type Queries = {
  details: page_DetailsQuery;
};

export default function DetailsPage({
  queries,
}: PastoriaPageProps<'/details/[name]'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query page_DetailsQuery($name: String!) @preloadable {
        greet(name: $name)
      }
    `,
    queries.details,
  );

  return <div>This is the details page for {greet}.</div>;
}
