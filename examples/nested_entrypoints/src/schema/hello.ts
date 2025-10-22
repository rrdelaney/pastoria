import {Context} from './context.js';

/**
 * A simple hello world query that returns a greeting message.
 *
 * @gqlQueryField
 */
export function hello(ctx: Context): string {
  return 'Hello from Pastoria!';
}

/**
 * Example query showing how to accept arguments.
 * Try querying: { greet(name: "World") }
 *
 * @gqlQueryField
 */
export function greet(name: string, ctx: Context): string {
  return `Hello, ${name}!`;
}
