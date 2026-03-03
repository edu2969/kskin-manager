import React, { ReactNode } from 'react';
import { AutoSaveContext } from '../context/AutoSaveContext';
import { useAutoSave } from '../hooks/useAutoSave';
import { useQueryClient } from '@tanstack/react-query';

interface AutoSaveProviderProps {
  children: ReactNode;
  fichaId?: string;
  pacienteId?: string;
  formMethods?: any; // Para acceder a reset del formulario
}

export function AutoSaveProvider({ children, fichaId, pacienteId, formMethods }: AutoSaveProviderProps) {
  const queryClient = useQueryClient();
  
  const autoSave = useAutoSave({
    fichaId,
    pacienteId,
    delay: 1500,
    onSuccess: async (changes) => {
      console.log('✅ Auto-guardado exitoso:', changes);
      
      // Para partos, invalidar la query y resetear formulario
      const hasPartosChanges = Object.keys(changes).some(key => key.startsWith('paciente.parto.'));
      if (hasPartosChanges) {
        console.log('🔄 Invalidando query de ficha por cambios en partos');
        
        // Invalidar query
        queryClient.invalidateQueries({
          queryKey: ['ficha', pacienteId, fichaId]
        });
        
        console.log('⏰ Query invalidada, React Query recargará automáticamente');
      }
    },
    onError: (error) => console.error('❌ Error en auto-guardado:', error)
  });

  return (
    <AutoSaveContext.Provider value={autoSave}>
      {children}
    </AutoSaveContext.Provider>
  );
}