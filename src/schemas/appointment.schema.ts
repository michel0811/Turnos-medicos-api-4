import { z } from 'zod';
import { text, specialty, date, time } from './common.schema.ts';
export const appointmentSchema = z.strictObject({ paciente: text, documento: text, medicoId: z.uuid().transform(v => v.toLowerCase()), especialidad: specialty, fecha: date, hora: time });
export const appointmentQuery = z.strictObject({ especialidad: text.optional(), fecha: date.optional(), medicoId: z.uuid().transform(v => v.toLowerCase()).optional() });
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuery>;
