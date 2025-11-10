// Core domain types for the medical system
export interface Paciente {
  _id: string;
  nombres: string;
  apellidos: string;
  rut: string;
  email?: string;
  fechaNacimiento?: Date;
  genero?: string;
  nombreSocial?: string;
  grupoSanguineo?: string;
  correoElectronico?: string;
  rutResponsable?: string;
  direccion?: string;
  telefono?: string;
  sistemaSalud?: SistemaSalud;
  alergias: string[];
  antecedenteMorbidoIds: AntecedenteMorbido[];
  medicamentoIds: MedicamentoInfo[];
  operaciones?: string;
  metodoAnticonceptivos: MetodoAnticonceptivo[];
  partos: Parto[];
  higiene: Higiene;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ficha {
  _id: string;
  pacienteId: string;
  profesionalId: string;
  anamnesis?: string;
  solicitudExamenes: string[];
  indicaciones?: string;
  recetas: Receta[];
  antecedentesMorbidos?: boolean;
  estadoConsulta?: EstadoConsulta;
  horaFin?: Date;
  duracionMinutos?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profesional {
  _id: string;
  userId: string;
  nombres: string;
  apellidos: string;
  especialidad: Especialidad;
  rutProfesional: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Especialidad {
  _id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
}

// Nested objects
export interface Higiene {
  fuma: boolean;
  agua: number; // cm³ por día
  ejercicioSemanal: number; // horas por semana
  nivelStress: number; // 1-10 scale
  calidadDormir: number; // 1-10 scale
  habitoAlimenticio: string;
}

export interface Parto {
  fecha?: Date;
  tipoParto: TipoParto;
  meses?: number;
  genero?: string;
}

export interface AntecedenteMorbido {
  _id: string;
  glosa: string;
  checked: boolean;
}

export interface MedicamentoInfo {
  _id: string;
  nombre: string;
  codigo?: string;
  unidades?: string;
  frecuencia?: number;
}

export interface MetodoAnticonceptivo {
  _id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
}

export interface Receta {
  fecha: Date;
  texto: string;
}

export interface ExamenInfo {
  codigo: string;
  nombre: string;
  sub?: ExamenInfo[];
}

// Enums
export type SistemaSalud = 'FON' | 'ISA' | 'PAR' | 'FAR' | 'OTR';
export type TipoParto = 'VAGINAL' | 'CESAREA' | 'ABORTO';
export type EstadoConsulta = 'EN_PROGRESO' | 'TERMINADA' | 'CANCELADA';

// Form interfaces for UI components
export interface PersonalFormData {
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
  sistemaSalud: SistemaSalud;
  grupoSanguineo: string;
  alergias: string[];
}

export interface AnamnesisFormData {
  anamnesis: string;
  operaciones: string;
  antecedenteMorbidos: AntecedenteMorbido[];
  medicamentos: MedicamentoInfo[];
  partos: Parto[];
  metodoAnticonceptivos: MetodoAnticonceptivo[];
  higiene: Higiene;
}

export interface ExamenesFormData {
  solicitudExamenes: string[];
}

export interface IndicacionesFormData {
  indicaciones: string;
}

export interface RecetaFormData {
  medicamentosReceta: MedicamentoInfo[];
  recetas: Receta[];
}

// API response interfaces
export interface FichaResponse {
  ficha: Ficha | null;
  paciente: Paciente;
  profesional: Profesional;
}

export interface HistorialResponse {
  historico: FichaHistorica[];
}

export interface FichaHistorica {
  _id: string;
  fecha: Date;
  profesional: {
    _id: string;
    nombre: string;
  };
}

// Hook interfaces
export interface UseFichaResult {
  data: FichaResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseSaveFieldResult {
  mutate: (key: string, value: unknown) => void;
  saving: boolean;
  error: Error | null;
}

// Tab configuration
export interface TabConfig {
  key: string;
  label: string;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

// Form field types for dynamic forms
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'number' 
  | 'date';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string; }[];
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

// Batch operation interfaces for API
export interface BatchOperation {
  operation: 'set' | 'push' | 'pull' | 'unset';
  field: string;
  value: unknown;
  arrayFilters?: unknown[];
}

export interface BatchUpdateRequest {
  pacienteId: string;
  operations: BatchOperation[];
}

export interface BatchUpdateResponse {
  success: boolean;
  operations: number;
  errors?: string[];
}