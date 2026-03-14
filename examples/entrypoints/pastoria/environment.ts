import {getSchema} from '#genfiles/schema/schema';
import {Context} from '#src/schema/context';
import {GraphQLSchema, specifiedDirectives} from 'graphql';
import {PastoriaEnvironment} from 'pastoria-runtime/server';

const schemaConfig = getSchema().toConfig();
const schema = new GraphQLSchema({
  ...schemaConfig,
  directives: [...specifiedDirectives, ...schemaConfig.directives],
});

export default new PastoriaEnvironment({
  schema,
  createContext: () => new Context(),
});
