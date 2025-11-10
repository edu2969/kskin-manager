import React, { memo, useState, useCallback } from 'react';
import { AntecedenteMorbido } from '../../types';
import { useSaveField } from '../../hooks/useSaveField';
import VirtualizedAntecedentesList from './VirtualizedAntecedentesList';

interface AntecedentesMorbidosProps {
  pacienteId: string;
  antecedentes: AntecedenteMorbido[];
  isLoading?: boolean;
}

const AntecedentesMorbidos: React.FC<AntecedentesMorbidosProps> = memo(({
  pacienteId,
  antecedentes,
  isLoading = false
}) => {
  const { mutate: saveField, saving, error } = useSaveField(pacienteId);
  const [otroAntecedente, setOtroAntecedente] = useState('');

  // Memoized handlers to prevent unnecessary re-renders
  const handleToggle = useCallback((index: number, checked: boolean) => {
    const updated = [...antecedentes];
    updated[index] = { ...updated[index], checked };
    saveField('antecedenteMorbidoIds', updated);
  }, [antecedentes, saveField]);

  const handleAddCustom = useCallback(() => {
    if (!otroAntecedente.trim()) return;
    
    const newAntecedente: AntecedenteMorbido = {
      _id: `custom-${Date.now()}`,
      glosa: otroAntecedente.trim(),
      checked: true
    };
    
    const updated = [...antecedentes, newAntecedente];
    saveField('antecedenteMorbidoIds', updated);
    setOtroAntecedente('');
  }, [otroAntecedente, antecedentes, saveField]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  }, [handleAddCustom]);

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-[#ac9164] border-t-transparent rounded-full mx-auto mb-2"></div>
        <div className="text-sm text-[#8e9b6d]">Cargando antecedentes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      {(saving || error) && (
        <div className="flex items-center gap-2 text-sm">
          {saving && (
            <span className="flex items-center gap-1 text-blue-500">
              <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
              Guardando...
            </span>
          )}
          {error && (
            <span className="text-red-500">
              ⚠️ Error al guardar
            </span>
          )}
        </div>
      )}

      {/* Virtualized or regular list based on size */}
      <VirtualizedAntecedentesList
        antecedentes={antecedentes}
        onToggle={handleToggle}
        saving={saving}
        containerHeight={250}
      />

      {/* Add custom antecedente */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={otroAntecedente}
            onChange={(e) => setOtroAntecedente(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Agregar otro antecedente..."
            className="flex-1 border border-[#d5c7aa] rounded px-3 py-2 text-sm focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
            disabled={saving}
          />
          <button
            onClick={handleAddCustom}
            disabled={!otroAntecedente.trim() || saving}
            className="px-3 py-2 bg-[#66754c] text-white rounded text-sm hover:bg-[#8e9b6d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Summary */}
      {antecedentes.length > 0 && (
        <div className="text-xs text-[#8e9b6d] bg-[#f6eedb] p-2 rounded">
          {antecedentes.filter(a => a.checked).length} de {antecedentes.length} antecedentes seleccionados
        </div>
      )}
    </div>
  );
});

AntecedentesMorbidos.displayName = 'AntecedentesMorbidos';

export default AntecedentesMorbidos;