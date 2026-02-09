import {JSResource, ModuleType} from '#genfiles/router/js_resource';
import {EntryPointParams} from '#genfiles/router/router';
import {EntryPoint} from 'react-relay/hooks';

/** @route / */
export const entrypoint: EntryPoint<
  ModuleType<'m#home'>,
  EntryPointParams<'/'>
> = {
  root: JSResource.fromModuleId('m#home'),
  getPreloadProps(_variables) {
    return {queries: {}};
  },
};
