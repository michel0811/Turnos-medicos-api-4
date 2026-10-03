import { AppError } from '../models/app-error.ts';
export function errorResponse(error: unknown) {
  if (error instanceof AppError) return { status: error.status, message: error.message, code: error.code, details: error.details };
  console.error('Error interno:', error);
  return { status: 500, message: 'Error interno del servidor', code: 'INTERNAL_ERROR', details: [] };
}
