import {PastoriaEnvironment} from 'pastoria-runtime/server';
import {getSchema} from '#genfiles/schema/schema';
import {Context} from '#src/schema/context';

export default new PastoriaEnvironment({
  schema: getSchema(),
  createContext: (req) => Context.createFromRequest(req),
});
