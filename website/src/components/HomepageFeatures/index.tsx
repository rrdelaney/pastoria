import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  code?: string;
};

const features: FeatureItem[] = [
  {
    title: 'Type-Safe Routing with JSDoc',
    description: (
      <>
        Define routes using simple JSDoc annotations. Pastoria generates
        type-safe routing code automatically, giving you full IDE autocomplete
        and type checking without manual configuration.
      </>
    ),
    code: `/**
 * @route /users/:userId
 * @param userId string
 */
export const entrypoint: EntryPoint = {
  root: JSResource.fromModuleId('m#user_profile'),
  getPreloadProps({params, schema}) {
    const {userId} = schema.parse(params);
    return {
      queries: {
        userQueryRef: {
          parameters: UserProfileQueryParameters,
          variables: {userId},
        },
      },
    };
  },
};`,
  },
  {
    title: 'GraphQL with React Relay',
    description: (
      <>
        Built on React Relay for efficient data fetching with automatic query
        optimization, persisted queries, and seamless server-side rendering.
        Queries are preloaded on the server and hydrated on the client.
      </>
    ),
    code: `export const UserProfile: EntryPointComponent = ({queries}) => {
  const data = usePreloadedQuery(
    graphql\`
      query UserProfileQuery($userId: ID!) @preloadable {
        user(id: $userId) {
          name
          email
          ...UserAvatar_user
        }
      }
    \`,
    queries.userQueryRef,
  );

  return <UserCard user={data.user} />;
};`,
  },
  {
    title: 'SSR & Code Generation',
    description: (
      <>
        Server-side rendering out of the box with automatic code splitting and
        lazy loading. Run <code>pastoria gen</code> to generate your router,
        then <code>pastoria dev</code> to start developing with hot module
        replacement.
      </>
    ),
    code: `# Generate type-safe router
$ pastoria gen

# Start dev server with HMR
$ pastoria dev

# Build for production
$ pastoria build

# Deploy with the standalone server
$ pastoria-server`,
  },
];

function Feature({title, description, code}: FeatureItem) {
  return (
    <div className={clsx('col col--12', styles.feature)}>
      <div className="row">
        <div className={clsx('col', code ? 'col--6' : 'col--12')}>
          <Heading as="h3">{title}</Heading>
          <p className={styles.featureDescription}>{description}</p>
        </div>
        {code && (
          <div className="col col--6">
            <CodeBlock language="tsx">{code}</CodeBlock>
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
