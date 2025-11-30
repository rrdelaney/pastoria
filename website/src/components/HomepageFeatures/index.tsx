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
    title: 'GraphQL-integrated Router',
    description: (
      <>
        Define routes using simple JSDoc annotations. Pastoria generates
        type-safe routing code automatically, giving you full IDE autocomplete
        and type checking without manual configuration.
      </>
    ),
    code: `/** @route /users/:userId */
export const UserPage: EntryPointComponent<
  { userQuery: UserQuery }, {}
> = ({ queries }) => {
  // Queries are loaded on the server during SSR,
  // subsequent navigations suspend the page.
  const { user } = usePreloadedQuery(graphql\`
    query UserQuery($userId: String!) {
      user(id: $userId) {
        ...user_UserCard
      }
    }
  \`, queries.userQuery);

  // Type-safe data fetching using Relay.
  return (
    <>
      Hello {user.name}!
      <UserCard user={user} />
    </>
  );
};`,
  },
  {
    title: 'Type-safe Navigation and Routing',
    description: (
      <>
        Built on React Relay for efficient data fetching with automatic query
        optimization, persisted queries, and seamless server-side rendering.
        Queries are preloaded on the server and hydrated on the client.
      </>
    ),
    code: `function UserCard(props: { user: user_UserCard$key }) {
  const user = useFragment(
    graphql\`fragment user_UserCard on User {
      id
      name
    }\`,
    props.user
  );

  return (
    <RouteLink route="/users/:userId" params={{ userId: userId }}>
      {user.name}
    </RouteLink>
  );
}`,
  },
  {
    title: 'Unified Code Generation',
    description: (
      <>
        Server-side rendering out of the box with automatic code splitting and
        lazy loading. Run <code>pastoria gen</code> to generate your router,
        then <code>pastoria dev</code> to start developing with hot module
        replacement.
      </>
    ),
    lang: 'bash',
    code: `# Generate GraphQL queries and router
$ pastoria make

# Start dev server backed by Vite
$ pastoria dev

# Build for production
$ pastoria make --release

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
