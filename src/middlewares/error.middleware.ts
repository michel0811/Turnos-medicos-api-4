import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../models/app-error.ts';
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ status: 400, message: 'Error de validación en los datos ingresados', code: 'VALIDATION_ERROR', details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message, code: i.code })) }); return;
  }
  if (error instanceof AppError) { res.status(error.status).json({status: error.status, message: error.message, code: error.code, details: error.details}); return; }
  if (error?.type === 'entity.parse.failed') { res.status(400).json({status:400,message:'El cuerpo debe ser JSON válido',code:'INVALID_JSON',details:[]}); return; }
  if (error?.type === 'entity.too.large') { res.status(400).json({status:400,message:'El cuerpo supera el límite de 100 KB',code:'BODY_TOO_LARGE',details:[]}); return; }
  console.error('Error interno:', error);
  res.status(500).json({status:500,message:'Error interno del servidor',code:'INTERNAL_ERROR',details:[]});
};
