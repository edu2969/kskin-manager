import React, { ReactNode } from 'react';
import { AutoSaveContext } from '../context/AutoSaveContext';
import { useAutoSave } from '../hooks/useAutoSave';

interface AutoSaveProviderProps {
  children: ReactNode;
  fichaId?: string;
  pacienteId?: string;
}

export function AutoSaveProvider({ children, fichaId, pacienteId }: AutoSaveProviderProps) {
  const autoSave = useAutoSave({
    fichaId,
    pacienteId,
    delay: 1500,
    onSuccess: () => console.log('✅ Auto-guardado exitoso'),
    onError: (error) => console.error('❌ Error en auto-guardado:', error)
  });

  return (
    <AutoSaveContext.Provider value={autoSave}>
      {children}
    </AutoSaveContext.Provider>
  );
}