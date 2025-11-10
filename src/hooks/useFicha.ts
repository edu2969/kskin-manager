import { useQuery } from '@tanstack/react-query';
import { FichaResponse, QUERY_KEYS } from '../types';

// API function to fetch ficha data
async function fetchFicha(pacienteId: string): Promise<FichaResponse> {
  const response = await fetch(`/api/paciente/ficha?pacienteId=${pacienteId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ficha: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data.paciente) {
    throw new Error('Invalid response: missing paciente data');
  }
  
  return {
    ficha: data.ficha || null,
    paciente: data.paciente,
    profesional: data.profesional
  };
}

export interface UseFichaOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useFicha(pacienteId: string, options: UseFichaOptions = {}) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const query = useQuery<FichaResponse>({
    queryKey: QUERY_KEYS.ficha(pacienteId),
    queryFn: () => fetchFicha(pacienteId),
    enabled: enabled && !!pacienteId,
    refetchOnWindowFocus,
    staleTime,
    gcTime,
    retry: (failureCount, error) => {
      // Don't retry on 404 (patient not found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return {
    // Data
    data: query.data || null,
    ficha: query.data?.ficha || null,
    paciente: query.data?.paciente || null,
    profesional: query.data?.profesional || null,
    
    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    
    // Actions
    refetch: query.refetch,
    
    // Computed values
    fichaCompleta: !query.isLoading && !!query.data,
    hasError: query.isError,
    errorMessage: query.error?.message || null,
    
    // For debugging/development
    queryKey: QUERY_KEYS.ficha(pacienteId),
    status: query.status,
  };
}

// Hook for fetching historic fichas
export function useFichaHistorico(pacienteId: string, options: UseFichaOptions = {}) {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes for historic data
    gcTime = 30 * 60 * 1000, // 30 minutes cache
  } = options;

  return useQuery({
    queryKey: QUERY_KEYS.historico(pacienteId),
    queryFn: async () => {
      const response = await fetch(`/api/paciente/historico?pacienteId=${pacienteId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch historic fichas: ${response.status}`);
      }
      return response.json();
    },
    enabled: enabled && !!pacienteId,
    staleTime,
    gcTime,
    retry: 2,
  });
}

// Hook for fetching supporting data (antecedentes, medicamentos, examenes)
export function useSupportingData() {
  const antecedentes = useQuery({
    queryKey: QUERY_KEYS.antecedentes(),
    queryFn: async () => {
      const response = await fetch('/api/antecedentesMorbidos');
      if (!response.ok) throw new Error('Failed to fetch antecedentes');
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - this data changes rarely
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });

  const medicamentos = useQuery({
    queryKey: QUERY_KEYS.medicamentos(),
    queryFn: async () => {
      const response = await fetch('/api/medicamentos');
      if (!response.ok) throw new Error('Failed to fetch medicamentos');
      return response.json();
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const examenes = useQuery({
    queryKey: QUERY_KEYS.examenes(),
    queryFn: async () => {
      const response = await fetch('/api/examenes');
      if (!response.ok) throw new Error('Failed to fetch examenes');
      return response.json();
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    antecedentes: {
      data: antecedentes.data || [],
      isLoading: antecedentes.isLoading,
      error: antecedentes.error,
    },
    medicamentos: {
      data: medicamentos.data || [],
      isLoading: medicamentos.isLoading,
      error: medicamentos.error,
    },
    examenes: {
      data: examenes.data || [],
      isLoading: examenes.isLoading,
      error: examenes.error,
    },
    
    // Combined loading state
    isLoading: antecedentes.isLoading || medicamentos.isLoading || examenes.isLoading,
    hasError: antecedentes.isError || medicamentos.isError || examenes.isError,
    errors: [antecedentes.error, medicamentos.error, examenes.error].filter(Boolean),
  };
}

export default useFicha;