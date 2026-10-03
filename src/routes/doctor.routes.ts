import { Router } from 'express';
import * as controller from '../controllers/doctor.controller.ts';
export const router = Router();
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
