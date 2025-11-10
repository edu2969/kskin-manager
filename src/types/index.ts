export * from './ficha.dto';
export * from './common';

// Re-export commonly used types for convenience
export type {
  Paciente,
  Ficha,
  Profesional,
  FichaResponse,
  UseFichaResult,
  UseSaveFieldResult,
  TabConfig,
  FormFieldConfig
} from './ficha.dto';

export type {
  ApiError,
  ApiResponse,
  LoadingState,
  AsyncState,
  BaseComponentProps,
  FormFieldProps,
  TabProps,
  FC,
  UseAsyncReturn,
  UseFormReturn
} from './common';

// Constants and enums
export const SISTEMA_SALUD_OPTIONS = [
  { value: 'FON', label: 'Fonasa' },
  { value: 'ISA', label: 'Isapre' },
  { value: 'PAR', label: 'Particular' },
  { value: 'FAR', label: 'Fuerzas Armadas' },
  { value: 'OTR', label: 'Otro' }
] as const;

export const TIPO_PARTO_OPTIONS = [
  { value: 'VAGINAL', label: 'Vaginal' },
  { value: 'CESAREA', label: 'Cesárea' },
  { value: 'ABORTO', label: 'Aborto' }
] as const;

export const CALIDAD_DORMIR_OPTIONS = [
  { value: 1, label: 'Muy mala (1)' },
  { value: 2, label: 'Mala (2)' },
  { value: 3, label: 'Regular (3)' },
  { value: 4, label: 'Buena (4)' },
  { value: 5, label: 'Muy buena (5)' }
] as const;

export const NIVEL_STRESS_OPTIONS = [
  { value: 1, label: 'Muy bajo (1)' },
  { value: 2, label: 'Bajo (2)' },
  { value: 3, label: 'Moderado (3)' },
  { value: 4, label: 'Alto (4)' },
  { value: 5, label: 'Muy alto (5)' }
] as const;