import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  code?: string;
  lang?: string;
};

const features: FeatureItem[] = [
  {
    title: 'File-Based Routing with GraphQL',
    description: (
      <>
        Define routes with <code>page.tsx</code> files. Declare GraphQL queries
        as types and Pastoria preloads them on the server during SSR. No loading
        spinners on initial page load.
      </>
    ),
    code: `import { graphql, usePreloadedQuery } from 'react-relay';

export type Queries = {
  user: page_UserQuery;
};

export default function UserPage({
  queries,
}: PastoriaPageProps<'/users/[id]'>) {
  const { user } = usePreloadedQuery(graphql\`
    query page_UserQuery($id: String!) @preloadable {
      user(id: $id) {
        name
        ...UserCard_user
      }
    }
  \`, queries.user);

  return <UserCard user={user} />;
}`,
  },
  {
    title: 'Type-Safe Navigation',
    description: (
      <>
        The generated router provides type-safe navigation hooks and link
        components. Route IDs, params, and query variables are all checked at
        compile time.
      </>
    ),
    code: `import { useFragment, graphql } from 'react-relay';
import { RouteLink } from '#genfiles/router/router';

function UserCard(props: { user: UserCard_user$key }) {
  const user = useFragment(
    graphql\`fragment UserCard_user on User {
      id
      name
    }\`,
    props.user
  );

  return (
    <RouteLink route="/users/[id]" params={{ id: user.id }}>
      {user.name}
    </RouteLink>
  );
}`,
  },
  {
    title: 'Unified Code Generation',
    description: (
      <>
        Server-side rendering, code splitting, and lazy loading out of the box.
        Run <code>pastoria generate</code> to wire up your routes, then{' '}
        <code>pastoria dev</code> to start developing with hot module
        replacement powered by Vite.
      </>
    ),
    lang: 'bash',
    code: `# Run the full generate pipeline
$ pnpm generate

# Start dev server backed by Vite
$ pastoria dev

# Build for production
$ pastoria build

# Deploy with the standalone server
$ pastoria-server`,
  },
];

function Feature({title, description, code, lang}: FeatureItem) {
  return (
    <div className={clsx('col col--12', styles.feature)}>
      <div className="row">
        <div className={clsx('col', code ? 'col--6' : 'col--12')}>
          <Heading as="h3">{title}</Heading>
          <p className={styles.featureDescription}>{description}</p>
        </div>
        {code && (
          <div className="col col--6">
            <CodeBlock language={lang ?? 'tsx'}>{code}</CodeBlock>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
