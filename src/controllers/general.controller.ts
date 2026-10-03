import type { Request, Response } from 'express';
import { errorResponse } from '../utils/http-error.ts';
import { AppError } from '../models/app-error.ts';
export async function welcome(_req: Request, res: Response) {
  let status = 500;
  try {
    status = 200;
    return res.status(status).json({ message: 'Hello World! Bienvenido a TurnosMed', version: '3.0.0' });
  } catch (error) {
    const failure = errorResponse(error);
    status = failure.status;
    return res.status(status).json(failure);
  }
}
export async function notFound(_req: Request, res: Response) {
  let status = 500;
  try {
    status = 404;
    throw new AppError(status, 'Ruta no encontrada', 'ROUTE_NOT_FOUND');
  } catch (error) {
    const failure = errorResponse(error);
    status = failure.status;
    return res.status(status).json(failure);
  }
}
