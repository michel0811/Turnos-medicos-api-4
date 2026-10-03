import { z } from 'zod';
import { text, specialty } from './common.schema.ts';
export const doctorSchema = z.strictObject({ nombre: text, especialidad: specialty, disponible: z.boolean() });
export const doctorQuery = z.strictObject({ especialidad: text.optional(), disponible: z.enum(['true', 'false']).transform(v => v === 'true').optional() });
export type DoctorInput = z.infer<typeof doctorSchema>;
export type DoctorQuery = z.infer<typeof doctorQuery>;
