import {page_HelloQuery} from '#genfiles/queries/page_HelloQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';
import stylex from '@stylexjs/stylex';

const styles = stylex.create({
  text: {
    color: 'white',
  },
});

export type Queries = {
  hello: page_HelloQuery;
};

export default function HelloPage({
  queries,
}: PastoriaPageProps<'/hello/[name]'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query page_HelloQuery($name: String!) @preloadable {
        greet(name: $name)
      }
    `,
    queries.hello,
  );

  return (
    <div {...stylex.props(styles.text)}>
      This is the details page for {greet}.
    </div>
  );
}

export const getPreloadProps: GetPreloadProps<'/hello/[name]'> = ({
  variables,
  queries,
}) => {
  return {
    queries: {
      hello: queries.hello({name: variables.name}),
    },
  };
};
