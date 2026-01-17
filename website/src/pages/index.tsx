import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import AnimatedBackground from '@site/src/components/AnimatedBackground';

import styles from './index.module.css';

function RelayIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Center node */}
      <circle cx="50" cy="50" r="8" fill="url(#centerGradient)" />
      <circle
        cx="50"
        cy="50"
        r="12"
        stroke="url(#glowGradient)"
        strokeWidth="2"
        opacity="0.5"
      />

      {/* Outer nodes */}
      <circle cx="20" cy="30" r="5" fill="#6d9afb" />
      <circle cx="80" cy="25" r="5" fill="#a855f7" />
      <circle cx="85" cy="70" r="5" fill="#f97316" />
      <circle cx="25" cy="75" r="5" fill="#22d3ee" />
      <circle cx="50" cy="10" r="4" fill="#6d9afb" opacity="0.7" />
      <circle cx="50" cy="90" r="4" fill="#a855f7" opacity="0.7" />

      {/* Connection lines */}
      <line
        x1="50"
        y1="50"
        x2="20"
        y2="30"
        stroke="url(#lineGradient1)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1="50"
        y1="50"
        x2="80"
        y2="25"
        stroke="url(#lineGradient2)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1="50"
        y1="50"
        x2="85"
        y2="70"
        stroke="url(#lineGradient3)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1="50"
        y1="50"
        x2="25"
        y2="75"
        stroke="url(#lineGradient4)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="10"
        stroke="url(#lineGradient1)"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="90"
        stroke="url(#lineGradient2)"
        strokeWidth="1.5"
        opacity="0.4"
      />

      {/* Animated spark dots */}
      <circle r="3" fill="#fff">
        <animateMotion dur="2s" repeatCount="indefinite" path="M50,50 L20,30" />
      </circle>
      <circle r="3" fill="#fff">
        <animateMotion
          dur="2.5s"
          repeatCount="indefinite"
          path="M50,50 L80,25"
          begin="0.5s"
        />
      </circle>
      <circle r="2.5" fill="#fff">
        <animateMotion
          dur="1.8s"
          repeatCount="indefinite"
          path="M50,50 L85,70"
          begin="1s"
        />
      </circle>
      <circle r="2.5" fill="#fff">
        <animateMotion
          dur="2.2s"
          repeatCount="indefinite"
          path="M50,50 L25,75"
          begin="0.3s"
        />
      </circle>

      <defs>
        <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d9afb" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d9afb" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d9afb" />
          <stop offset="100%" stopColor="#6d9afb" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="lineGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <div className={styles.featureCard} style={{animationDelay: `${delay}ms`}}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

function HomepageHero() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={styles.hero}>
      <AnimatedBackground />
      <div className={styles.heroContent}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Full-Stack JavaScript Framework
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleGradient}>{siteConfig.title}</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Build scalable, data-driven applications with filesystem-based
          routing, React Relay, and server-side rendering.
        </p>

        <div className={styles.heroButtons}>
          <Link className={styles.primaryButton} to="/docs/intro">
            Get Started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            className={styles.secondaryButton}
            to="https://github.com/rrdelaney/pastoria"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </Link>
        </div>

        <div className={styles.relayBadge}>
          <RelayIcon className={styles.relayIcon} />
          <span>Powered by React Relay</span>
        </div>
      </div>

      <div className={styles.heroGlow} />
    </header>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className={styles.featuresContainer}>
        <h2 className={styles.sectionTitle}>
          Everything you need to build modern apps
        </h2>
        <p className={styles.sectionSubtitle}>
          A batteries-included framework that handles routing, data fetching,
          and rendering so you can focus on your product.
        </p>

        <div className={styles.featuresGrid}>
          <FeatureCard
            delay={0}
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" />
              </svg>
            }
            title="Filesystem Routing"
            description="Define routes by creating files in the pastoria/ directory. Dynamic segments, nested layouts, and API routes work out of the box."
          />
          <FeatureCard
            delay={100}
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="4" r="2" />
                <circle cx="20" cy="12" r="2" />
                <circle cx="12" cy="20" r="2" />
                <circle cx="4" cy="12" r="2" />
                <line x1="12" y1="7" x2="12" y2="9" />
                <line x1="15" y1="12" x2="18" y2="12" />
                <line x1="12" y1="15" x2="12" y2="18" />
                <line x1="6" y1="12" x2="9" y2="12" />
              </svg>
            }
            title="GraphQL + Relay"
            description="Colocate your data requirements with your components. Relay handles caching, pagination, and optimistic updates automatically."
          />
          <FeatureCard
            delay={200}
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            }
            title="Server-Side Rendering"
            description="Pages render on the server for fast initial loads and SEO. Hydration is automatic with Relay state transfer."
          />
          <FeatureCard
            delay={300}
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            }
            title="Type-Safe Everything"
            description="Full TypeScript support from routes to queries. PageProps infers the exact shape of your data and parameters."
          />
          <FeatureCard
            delay={400}
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
            title="Vite-Powered"
            description="Lightning-fast development with hot module replacement. Production builds are optimized and code-split automatically."
          />
          <FeatureCard
            delay={500}
            icon={
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            }
            title="Simple CLI"
            description="Three commands: generate, dev, and build. No configuration files to maintain or complex setup required."
          />
        </div>
      </div>
    </section>
  );
}

function CodePreview() {
  return (
    <section className={styles.codeSection}>
      <div className={styles.codeContainer}>
        <h2 className={styles.sectionTitle}>Intuitive API, powerful results</h2>
        <p className={styles.sectionSubtitle}>
          Define your page, declare your data needs, and let Pastoria handle the
          rest.
        </p>

        <div className={styles.codeWindow}>
          <div className={styles.codeHeader}>
            <div className={styles.codeDots}>
              <span />
              <span />
              <span />
            </div>
            <span className={styles.codeFilename}>
              pastoria/users/[id]/page.tsx
            </span>
          </div>
          <pre className={styles.codeContent}>
            <code>{`import {graphql, usePreloadedQuery} from 'react-relay';
import type {PageProps} from '#genfiles/router/types';
import type {page_UserQuery} from '#genfiles/queries/page_UserQuery.graphql';

export const queries = {
  user: {} as page_UserQuery,
};

export default function UserPage({queries}: PageProps<'/users/[id]'>) {
  const data = usePreloadedQuery(
    graphql\`
      query page_UserQuery($id: ID!) {
        user(id: $id) {
          name
          email
          avatar
        }
      }
    \`,
    queries.user,
  );

  return (
    <div>
      <img src={data.user.avatar} alt={data.user.name} />
      <h1>{data.user.name}</h1>
      <p>{data.user.email}</p>
    </div>
  );
}`}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>Ready to build something amazing?</h2>
        <p className={styles.ctaSubtitle}>
          Get started with Pastoria in minutes. No complex configuration
          required.
        </p>
        <div className={styles.ctaButtons}>
          <Link className={styles.primaryButton} to="/docs/intro">
            Read the Docs
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className={styles.ctaTerminal}>
          <code>npx create-pastoria@latest my-app</code>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout description="A full-stack JavaScript framework for building scalable, data-driven apps with filesystem-based routing, React Relay, and server-side rendering.">
      <HomepageHero />
      <main>
        <FeaturesSection />
        <CodePreview />
        <CTASection />
      </main>
    </Layout>
  );
}
