import { readFile } from 'node:fs/promises';
import { z } from 'zod';
export interface Doctor { medicoId: string; nombre: string; especialidad: string; disponible: boolean }
export interface Appointment { turnoId: string; paciente: string; documento: string; medicoId: string; especialidad: string; fecha: string; hora: string }
export interface Specialty { especialidadId: string; nombreEspecialidad: string; activa: boolean }
export const doctors: Doctor[] = [];
export const appointments: Appointment[] = [];
export const specialties: Specialty[] = [];
const specialtySchema = z.strictObject({ especialidadId: z.uuid(), nombreEspecialidad: z.string().min(1), activa: z.boolean() });
const legacyDoctor = z.strictObject({ medicoId: z.uuid(), nombre: z.string().min(1), especialidad: z.string().min(1), activo: z.boolean() });
export async function loadData() {
  // Both source and compiled files resolve the original JSON catalog from this location.
  const base = new URL('../../src/data/', import.meta.url);
  const catalog = z.array(specialtySchema).min(20).parse(JSON.parse(await readFile(new URL('especialidades.json', base), 'utf8')));
  const professionals = z.array(legacyDoctor).min(30).parse(JSON.parse(await readFile(new URL('profesionales.json', base), 'utf8')));
  const ids = [...catalog.map(s => s.especialidadId), ...professionals.map(d => d.medicoId)];
  if (new Set(ids).size !== ids.length) throw new Error('IDs duplicados en los datos iniciales');
  if (new Set(catalog.map(s => s.nombreEspecialidad)).size !== catalog.length) throw new Error('Especialidades duplicadas');
  if (professionals.some(d => !catalog.some(s => s.nombreEspecialidad === d.especialidad))) throw new Error('Especialidad desconocida en los datos iniciales');
  specialties.splice(0, specialties.length, ...catalog);
  doctors.splice(0, doctors.length, ...professionals.map(({activo, ...d}) => ({...d, disponible: activo})));
  appointments.splice(0);
}
