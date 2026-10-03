import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
export function validate(schema: ZodType, source: 'body' | 'query' | 'params'): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) { next(result.error); return; }
    // Express 5 exposes req.query as a getter: parsed values belong in locals.
    res.locals[source] = result.data; next();
  };
}
