import { randomUUID } from 'node:crypto';
import { specialties, doctors, appointments } from '../models/store.ts';
import { AppError } from '../models/app-error.ts';
import { normalize } from '../schemas/common.schema.ts';
import type { SpecialtyInput, SpecialtyQuery } from '../schemas/specialty.schema.ts';
export function list(q: SpecialtyQuery) {
  return specialties.filter(s => (!q.nombre || normalize(s.nombreEspecialidad) === normalize(q.nombre)) && (q.activa === undefined || s.activa === q.activa));
}
export function get(id: string) {
  const result = specialties.find(s => s.especialidadId === id);
  if (!result) throw new AppError(404, 'Especialidad no encontrada', 'SPECIALTY_NOT_FOUND');
  return result;
}
function checkName(data: SpecialtyInput, id?: string) {
  if (specialties.some(s => s.especialidadId !== id && normalize(s.nombreEspecialidad) === normalize(data.nombreEspecialidad))) {
    throw new AppError(400, 'Ya existe una especialidad con ese nombre', 'SPECIALTY_DUPLICATE');
  }
}
function linked(name: string) {
  return doctors.some(d => d.especialidad === name) || appointments.some(a => a.especialidad === name);
}
export function create(data: SpecialtyInput) {
  checkName(data);
  const result = { especialidadId: randomUUID(), ...data };
  specialties.push(result);
  return result;
}
export function update(id: string, data: SpecialtyInput) {
  const result = get(id);
  checkName(data, id);
  if ((data.nombreEspecialidad !== result.nombreEspecialidad || !data.activa) && linked(result.nombreEspecialidad)) {
    throw new AppError(400, 'La especialidad tiene profesionales o turnos asociados', 'SPECIALTY_IN_USE');
  }
  Object.assign(result, data);
  return result;
}
export function remove(id: string) {
  const result = get(id);
  if (linked(result.nombreEspecialidad)) throw new AppError(400, 'La especialidad tiene profesionales o turnos asociados', 'SPECIALTY_IN_USE');
  specialties.splice(specialties.findIndex(s => s.especialidadId === id), 1);
}
