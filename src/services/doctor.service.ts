import { randomUUID } from 'node:crypto';
import { doctors, appointments } from '../models/store.ts';
import type { DoctorInput, DoctorQuery } from '../schemas/doctor.schema.ts';
import { normalize } from '../schemas/common.schema.ts';
import { AppError } from '../models/app-error.ts';
export function list(q: DoctorQuery) { return doctors.filter(d => (!q.especialidad || normalize(d.especialidad) === normalize(q.especialidad)) && (q.disponible === undefined || d.disponible === q.disponible)); }
export function get(id: string) { const d = doctors.find(d => d.medicoId === id); if (!d) throw new AppError(404,'Médico no encontrado','DOCTOR_NOT_FOUND'); return d; }
export function create(data: DoctorInput) { const d = {medicoId:randomUUID(),...data}; doctors.push(d); return d; }
export function update(id: string, data: DoctorInput) {
  const d = get(id);
  if (d.especialidad !== data.especialidad && appointments.some(t => t.medicoId === id)) throw new AppError(400,'No se puede cambiar la especialidad de un médico con turnos asociados','DOCTOR_HAS_APPOINTMENTS');
  Object.assign(d,data); return d;
}
export function remove(id: string) {
  get(id);
  if (appointments.some(t => t.medicoId === id)) throw new AppError(400,'Elimine primero los turnos asociados al médico','DOCTOR_HAS_APPOINTMENTS');
  doctors.splice(doctors.findIndex(d => d.medicoId === id),1);
}
