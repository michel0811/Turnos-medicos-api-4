import { Router } from 'express';
import { create, book } from '../controllers/patient.controller.ts';
export const router = Router();
router.post('/', create);
router.post('/:id/turnos', book);
