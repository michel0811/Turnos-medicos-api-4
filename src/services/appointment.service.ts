import { randomUUID } from 'node:crypto';
import { appointments } from '../models/store.ts';
import type { AppointmentInput, AppointmentQuery } from '../schemas/appointment.schema.ts';
import { normalize } from '../schemas/common.schema.ts';
import { get as getDoctor } from './doctor.service.ts';
import { AppError } from '../models/app-error.ts';
export function list(q: AppointmentQuery) { return appointments.filter(t => (!q.especialidad || normalize(t.especialidad) === normalize(q.especialidad)) && (!q.fecha || t.fecha === q.fecha) && (!q.medicoId || t.medicoId === q.medicoId)); }
export function get(id: string) { const t = appointments.find(t => t.turnoId === id); if (!t) throw new AppError(404,'Turno no encontrado','APPOINTMENT_NOT_FOUND'); return t; }
function check(data: AppointmentInput, exclude?: string) {
  const doctor = getDoctor(data.medicoId);
  if (!doctor.disponible) throw new AppError(400,'El médico no está disponible','DOCTOR_UNAVAILABLE');
  if (doctor.especialidad !== data.especialidad) throw new AppError(400,'La especialidad no corresponde al médico','SPECIALTY_MISMATCH');
  const day = new Date(`${data.fecha}T12:00:00Z`).getUTCDay();
  if (day === 0 || day === 6 || data.hora < '07:00' || data.hora >= '13:00' || !['00','30'].includes(data.hora.slice(3)) || data.fecha > `${new Date().getFullYear()}-12-30`) throw new AppError(400,'Agenda: lunes a viernes, 07:00 a 12:30 cada 30 minutos, hasta el 30 de diciembre del año actual','INVALID_SCHEDULE');
  if (appointments.some(t => t.turnoId !== exclude && t.fecha === data.fecha && t.hora === data.hora && (t.medicoId === data.medicoId || t.documento === data.documento))) throw new AppError(400,'El médico o paciente ya tiene un turno en ese horario','SCHEDULE_CONFLICT');
}
export function create(data: AppointmentInput) { check(data); const t = {turnoId:randomUUID(),...data}; appointments.push(t); return t; }
export function update(id: string, data: AppointmentInput) { const t=get(id); check(data,id); Object.assign(t,data); return t; }
export function remove(id: string) { get(id); appointments.splice(appointments.findIndex(t => t.turnoId === id),1); }
