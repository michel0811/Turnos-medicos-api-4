import { randomUUID } from 'node:crypto';
import { patients } from '../models/patient.store.ts';
import type { PatientInput } from '../schemas/patient.schema.ts';
import type { AppointmentInput } from '../schemas/appointment.schema.ts';
import { create as createAppointment } from './appointment.service.ts';
import { AppError } from '../models/app-error.ts';
export function create(data: PatientInput) {
  if (patients.some(p => p.documento === data.documento)) throw new AppError(409, 'Ya existe un paciente con ese DNI', 'PATIENT_CONFLICT');
  const patient = { pacienteId: randomUUID(), ...data };
  patients.push(patient);
  return patient;
}
export function book(id: string, data: Omit<AppointmentInput, 'paciente' | 'documento'>) {
  const patient = patients.find(p => p.pacienteId === id);
  if (!patient) throw new AppError(404, 'Paciente no encontrado', 'PATIENT_NOT_FOUND');
  const appointment = createAppointment({ ...data, paciente: `${patient.nombre} ${patient.apellido}`, documento: patient.documento });
  return { pacienteId: id, ...appointment };
}
