import { z } from 'zod';
import { specialties } from '../models/store.ts';
export const idSchema = z.strictObject({ id: z.uuid().transform(v => v.toLowerCase()) });
export const text = z.string().trim().min(1, 'No puede estar vacío').max(150);
export const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// Body values must use the exact spelling of the original catalog.
export const specialty = text.refine(v => specialties.some(s => s.activa && s.nombreEspecialidad === v), 'Utilice una especialidad del catálogo, con mayúscula inicial y tildes');
export const date = z.string().transform(v => /^\d{2}\/\d{2}\/\d{4}$/.test(v) ? `${v.slice(6)}-${v.slice(3,5)}-${v.slice(0,2)}` : v).pipe(z.iso.date('Fecha inválida: use AAAA-MM-DD o DD/MM/AAAA'));
export const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida: use HH:MM');
