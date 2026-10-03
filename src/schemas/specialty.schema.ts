import { z } from 'zod';
import { text } from './common.schema.ts';
export const specialtySchema = z.strictObject({ nombreEspecialidad: text, activa: z.boolean() });
export const specialtyQuery = z.strictObject({ nombre: text.optional(), activa: z.enum(['true', 'false']).transform(v => v === 'true').optional() });
export type SpecialtyInput = z.infer<typeof specialtySchema>;
export type SpecialtyQuery = z.infer<typeof specialtyQuery>;
