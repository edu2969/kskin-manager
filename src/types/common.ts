// Common utility types and interfaces

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
  timestamp: Date;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = unknown> {
  data: T | null;
  status: LoadingState;
  error: ApiError | null;
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T = unknown> {
  data: T;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// Debounce configuration
export interface DebounceConfig {
  delay: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

// Component props interfaces
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
}

export interface TabProps extends BaseComponentProps {
  isActive?: boolean;
  onActivate?: () => void;
  title: string;
  color?: string;
}

// Query/Mutation keys for TanStack Query
export const QUERY_KEYS = {
  ficha: (pacienteId: string) => ['ficha', pacienteId] as const,
  historico: (pacienteId: string) => ['historico', pacienteId] as const,
  profesional: (userId: string) => ['profesional', userId] as const,
  antecedentes: () => ['antecedentes'] as const,
  medicamentos: () => ['medicamentos'] as const,
  examenes: () => ['examenes'] as const,
} as const;

export const MUTATION_KEYS = {
  updateField: () => ['updateField'] as const,
  batchUpdate: () => ['batchUpdate'] as const,
  terminarAtencion: () => ['terminarAtencion'] as const,
} as const;

// Event types for socket communication
export interface SocketEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  userId?: string;
}

// Performance monitoring interfaces
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: Date;
  context?: Record<string, unknown>;
}

// Accessibility interfaces
export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Theme and styling
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ComponentSize {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

// Configuration interfaces
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    enableBatchOperations: boolean;
    enableOptimisticUpdates: boolean;
    enablePerformanceMonitoring: boolean;
  };
  ui: {
    debounceDelay: number;
    maxRetries: number;
    virtualizationThreshold: number;
  };
}

// Type guards
export const isApiError = (error: unknown): error is ApiError => {
  return Boolean(error && typeof error === 'object' && 'message' in error && typeof (error as ApiError).message === 'string');
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return Boolean(error && typeof error === 'object' && 'field' in error && 'message' in error && 
    typeof (error as ValidationError).field === 'string' && typeof (error as ValidationError).message === 'string');
};

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Awaited<T> = T extends Promise<infer U> ? U : T;

// React component types
export type FC<P = object> = React.FunctionComponent<P>;
export type ComponentWithRef<T, P = object> = React.ForwardRefExoticComponent<P & React.RefAttributes<T>>;
export type MemoComponent<P = object> = React.MemoExoticComponent<React.FunctionComponent<P>>;

// Hook return types
export type UseAsyncReturn<T> = {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: unknown[]) => Promise<T>;
  reset: () => void;
};

export type UseFormReturn<T> = {
  values: T;
  errors: ValidationError[];
  touched: Record<keyof T, boolean>;
  handleChange: (field: keyof T) => (value: unknown) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (onSubmit: (values: T) => void) => (e: React.FormEvent) => void;
  reset: (values?: Partial<T>) => void;
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFieldError: (field: keyof T, error: string) => void;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
};