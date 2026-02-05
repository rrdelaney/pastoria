import helloWorld_HelloQueryParameters from '#genfiles/queries/helloWorld_HelloQuery$parameters';
import type {EntryPoints, Queries} from '#pastoria/cool/page';
import {EntryPoint} from 'react-relay/hooks';
import {z} from 'zod/v4-mini';
import {JSResource, ModuleType} from './js_resource';

const schema = z.object({name: z.string()});

const entrypoint: EntryPoint<ModuleType<'route(/cool)'>, {params: unknown}> = {
  root: JSResource.fromModuleId('route(/cool)'),
  getPreloadProps({params}) {
    const variables = schema.parse(params);
    return {
      queries: {
        nameQuery: {
          parameters: helloWorld_HelloQueryParameters,
          variables: {name: variables.name},
        },
      },
      entryPoints: {},
    };
  },
};

export {entrypoint, schema, type EntryPoints, type Queries};
