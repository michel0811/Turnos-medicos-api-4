import type { Request, Response } from 'express';
import * as service from '../services/appointment.service.ts';
import { appointmentSchema, appointmentQuery } from '../schemas/appointment.schema.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { parse } from '../utils/parse.ts';
import { errorResponse } from '../utils/http-error.ts';

export async function list(req: Request, res: Response) {
  let status = 500;
  try {
    const query = parse(appointmentQuery, req.query);
    const result = await service.list(query);
    status = 200;
    return res.status(status).json(result);
  } catch (error) {
    const failure = errorResponse(error);
    status = failure.status;
    return res.status(status).json(failure);
  }
}

export async function get(req: Request, res: Response) {
  let status = 500;
  try {
    const { id } = parse(idSchema, req.params);
    const result = await service.get(id);
    status = 200;
    return res.status(status).json(result);
  } catch (error) {
    const failure = errorResponse(error);
    status = failure.status;
    return res.status(status).json(failure);
  }
}

export async function create(req: Request, res: Response) {
  let status = 500;
  try {
    const body = parse(appointmentSchema, req.body);
    const result = await service.create(body);
    res.location(req.baseUrl + "/" + result.turnoId);
    status = 201;
    return res.status(status).json(result);
  } catch (error) {
    const failure = errorResponse(error);
    status = failure.status;
    return res.status(status).json(failure);
  }
}

export async function update(req: Request, res: Response) {
  let status = 500;
  try {
    const { id } = parse(idSchema, req.params);
    const body = parse(appointmentSchema, req.body);
    const result = await service.update(id, body);
    status = 200;
    return res.status(status).json(result);
  } catch (error) {
    const failure = errorResponse(error);
    status = failure.status;
    return res.status(status).json(failure);
  }
}

export async function remove(req: Request, res: Response) {
  let status = 500;
  try {
    const { id } = parse(idSchema, req.params);
    await service.remove(id);
    status = 204;
    return res.status(status).send();
  } catch (error) {
    const failure = errorResponse(error);
    status = failure.status;
    return res.status(status).json(failure);
  }
}
