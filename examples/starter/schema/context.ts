import type {Request} from 'express';

/**
 * @gqlContext
 */
export class Context {
  constructor(public readonly req: Request) {}

  static createFromRequest(req: Request): Context {
    return new Context(req);
  }
}
