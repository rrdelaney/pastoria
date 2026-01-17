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
    title: 'Filesystem-Based Routing with GraphQL',
    description: (
      <>
        Define routes by creating <code>page.tsx</code> files in the{' '}
        <code>pastoria/</code> directory. Pastoria generates type-safe routing
        code automatically, giving you full IDE autocomplete and type checking
        without manual configuration.
      </>
    ),
    code: `// pastoria/users/[userId]/page.tsx
import {graphql, usePreloadedQuery} from 'react-relay';
import userQuery from '#genfiles/queries/page_UserQuery.graphql';
import type {PageProps} from '#genfiles/router/types';

export const queries = {
  userQuery: userQuery,
};

export default function UserPage({queries}: PageProps<'/users/[userId]'>) {
  // Queries are preloaded on the server during SSR
  const {user} = usePreloadedQuery(
    graphql\`
      query page_UserQuery($userId: ID!) @preloadable {
        user(id: $userId) { name }
      }
    \`,
    queries.userQuery,
  );

  return <h1>Hello {user.name}!</h1>;
}`,
  },
  {
    title: 'Type-safe Navigation and Data Fetching',
    description: (
      <>
        Built on React Relay for efficient data fetching with automatic query
        optimization, persisted queries, and seamless server-side rendering.
        Route links are fully type-checked with parameters validated at compile
        time.
      </>
    ),
    code: `import {RouteLink} from '#genfiles/router/router.jsx';
import {graphql, useFragment} from 'react-relay';

function UserCard(props: {user: user_UserCard$key}) {
  const user = useFragment(
    graphql\`
      fragment user_UserCard on User {
        id
        name
      }
    \`,
    props.user,
  );

  return (
    <RouteLink route="/users/[userId]" params={{userId: user.id}}>
      {user.name}
    </RouteLink>
  );
}`,
  },
  {
    title: 'Simple CLI Workflow',
    description: (
      <>
        Server-side rendering out of the box with automatic code splitting and
        lazy loading. Run <code>pastoria generate</code> to generate your
        router, then <code>pastoria dev</code> to start developing with hot
        module replacement.
      </>
    ),
    lang: 'bash',
    code: `# Generate router from pastoria/ directory
$ pastoria generate

# Start dev server with hot reload
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
