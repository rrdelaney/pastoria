import {helloWorld_HelloQuery} from '#genfiles/queries/helloWorld_HelloQuery.graphql.js';
import {graphql, usePreloadedQuery} from 'react-relay';
import z from 'zod/v4-mini';

export const schema = z.object({name: z.string()});

export type Queries = {
  nameQuery: helloWorld_HelloQuery;
};

export type EntryPoints = {};

export default function CoolPage({queries}: PastoriaPageProps<'/cool'>) {
  const {greet} = usePreloadedQuery(
    graphql`
      query helloWorld_HelloQuery($name: String!)
      @preloadable
      @throwOnFieldError {
        greet(name: $name)
      }
    `,
    queries.nameQuery,
  );

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">{greet}</h1>
      </div>
    </div>
  );
}
