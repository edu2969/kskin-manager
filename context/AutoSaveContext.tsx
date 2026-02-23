import { createContext, useContext } from 'react';

interface AutoSaveContextType {
  saveField: (fieldPath: string, value: any) => void;
  saveBatch: (changes: Record<string, any>) => void;
  isPending: boolean;
  error: Error | null;
  isError: boolean;
}

// ✅ Solo el contexto, sin Provider
export const AutoSaveContext = createContext<AutoSaveContextType | null>(null);

// ✅ Hook para usar el contexto de forma segura
export function useAutoSaveContext() {
  const context = useContext(AutoSaveContext);
  if (!context) {
    throw new Error('useAutoSaveContext debe usarse dentro de AutoSaveProvider');
  }
  return context;
}