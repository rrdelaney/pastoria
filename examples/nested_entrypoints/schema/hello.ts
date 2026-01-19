import {Context} from './context.js';

/**
 * A simple hello world query that returns a greeting message.
 *
 * @gqlQueryField
 */
export function helloMessage(ctx: Context): string {
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

/**
 * Example query with an optional name argument.
 * Returns a personalized or generic greeting.
 *
 * @gqlQueryField
 */
export function optionalGreet(name: string | null, ctx: Context): string {
  if (name) {
    return `Hello, ${name}!`;
  }
  return 'Hello, World!';
}
