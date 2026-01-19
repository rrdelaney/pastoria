import page_OptionalGreetQuery from '#genfiles/queries/page_OptionalGreetQuery.graphql';
import type {PageProps} from '#genfiles/router/types';
import {Link, useRouteParams} from '#genfiles/router/router.jsx';
import {graphql, usePreloadedQuery} from 'react-relay';

export const queries = {
  greetQuery: page_OptionalGreetQuery,
};

export default function GreetPage({queries}: PageProps<'/greet/[[name]]'>) {
  const {optionalGreet} = usePreloadedQuery(
    graphql`
      query page_OptionalGreetQuery($name: String)
        @preloadable
        @throwOnFieldError {
        optionalGreet(name: $name)
      }
    `,
    queries.greetQuery,
  );

  const {name} = useRouteParams('/greet/[[name]]');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-4xl font-bold">{optionalGreet}</h1>

      <p className="mb-4 text-gray-600">
        This page uses an optional route parameter: <code>[[name]]</code>
      </p>

      <p className="mb-8 text-gray-500">
        Current name: <code>{name ?? '(none)'}</code>
      </p>

      <div className="flex gap-4">
        <Link
          href="/greet"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          /greet (no name)
        </Link>
        <Link
          href="/greet/Alice"
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          /greet/Alice
        </Link>
        <Link
          href="/greet/Bob"
          className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
        >
          /greet/Bob
        </Link>
      </div>

      <Link href="/" className="mt-8 text-blue-500 underline hover:text-blue-700">
        Back to home
      </Link>
    </div>
  );
}
