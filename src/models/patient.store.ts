import type { PatientInput } from '../schemas/patient.schema.ts';
export interface Patient extends PatientInput { pacienteId: string }
export const patients: Patient[] = [];
