import type { ZodType } from 'zod';
import { AppError } from '../models/app-error.ts';
export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    // AppError hereda de Error; se lanza antes de consultar o modificar datos.
    throw new AppError(400, 'Error de validación en los datos ingresados', 'VALIDATION_ERROR',
      result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message, code: i.code })));
  }
  return result.data;
}
