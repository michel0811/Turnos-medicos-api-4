import { z } from 'zod';
import { appointmentSchema } from './appointment.schema.ts';
const text = z.string().trim().min(1).max(150);
export const patientSchema = z.strictObject({
  documento: z.string().regex(/^\d{7,8}$/, 'DNI de 7 u 8 dígitos, sin puntos'),
  nombre: text, apellido: text,
  fechaNacimiento: z.iso.date().refine(v => v <= new Date().toISOString().slice(0,10), 'No puede ser futura'),
  email: z.email().max(254).optional(),
  telefono: z.string().regex(/^\+?[0-9 ()-]{7,25}$/).optional()
}).refine(v => Boolean(v.email || v.telefono), 'Se requiere email o teléfono');
export const bookingSchema = appointmentSchema.pick({ medicoId: true, especialidad: true, fecha: true, hora: true });
export type PatientInput = z.infer<typeof patientSchema>;
