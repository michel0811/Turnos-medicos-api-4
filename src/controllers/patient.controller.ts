import type { Request, Response } from 'express';
import { patientSchema, bookingSchema } from '../schemas/patient.schema.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { parse } from '../utils/parse.ts';
import { errorResponse } from '../utils/http-error.ts';
import * as service from '../services/patient.service.ts';
export async function create(req: Request, res: Response) {
  let status = 500;
  try {
    const body = parse(patientSchema, req.body);
    const result = await service.create(body);
    status = 201;
    return res.status(status).json(result);
  } catch (error) {
    const failure = errorResponse(error); status = failure.status;
    return res.status(status).json(failure);
  }
}
export async function book(req: Request, res: Response) {
  let status = 500;
  try {
    const { id } = parse(idSchema, req.params);
    const body = parse(bookingSchema, req.body);
    const result = await service.book(id, body);
    status = 201;
    return res.status(status).location(`/turnos/${result.turnoId}`).json(result);
  } catch (error) {
    const failure = errorResponse(error); status = failure.status;
    return res.status(status).json(failure);
  }
}
