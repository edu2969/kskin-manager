import React, { memo, useState, useCallback } from 'react';
import { useSaveField } from '../../hooks/useSaveField';

interface AlergiasFieldProps {
  pacienteId: string;
  alergias: string[];
}

const AlergiasField: React.FC<AlergiasFieldProps> = memo(({
  pacienteId,
  alergias
}) => {
  const { mutate: saveField, saving, error } = useSaveField(pacienteId);
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddAlergia = useCallback(() => {
    const newAlergia = inputValue.trim();
    if (!newAlergia || alergias.includes(newAlergia)) return;
    
    const updated = [...alergias, newAlergia];
    saveField('alergias', updated);
    setInputValue('');
  }, [inputValue, alergias, saveField]);

  const handleRemoveAlergia = useCallback((index: number) => {
    const updated = alergias.filter((_, i) => i !== index);
    saveField('alergias', updated);
  }, [alergias, saveField]);

  const handleEditAlergia = useCallback((index: number, newValue: string) => {
    const updated = [...alergias];
    updated[index] = newValue.trim();
    saveField('alergias', updated);
    setEditingIndex(null);
  }, [alergias, saveField]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAlergia();
    } else if (e.key === 'Escape') {
      setInputValue('');
    }
  }, [handleAddAlergia]);

  const handleBulkInput = useCallback((value: string) => {
    // Handle comma-separated input
    const newAlergias = value
      .split(',')
      .map(a => a.trim())
      .filter(a => a && !alergias.includes(a));
    
    if (newAlergias.length > 0) {
      const updated = [...alergias, ...newAlergias];
      saveField('alergias', updated);
    }
  }, [alergias, saveField]);

  return (
    <div className="space-y-3">
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

      {/* Input field */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={() => {
            if (inputValue.includes(',')) {
              handleBulkInput(inputValue);
              setInputValue('');
            }
          }}
          placeholder="Agregar alergia (separar múltiples con comas)..."
          className="flex-1 border border-[#d5c7aa] rounded px-3 py-2 text-sm focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
          disabled={saving}
        />
        <button
          onClick={handleAddAlergia}
          disabled={!inputValue.trim() || saving}
          className="px-3 py-2 bg-[#66754c] text-white rounded text-sm hover:bg-[#8e9b6d] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar
        </button>
      </div>

      {/* Alergias list */}
      {alergias.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#68563c]">
              Alergias registradas ({alergias.length})
            </span>
            {alergias.length > 0 && (
              <button
                onClick={() => saveField('alergias', [])}
                className="text-xs text-red-500 hover:text-red-700"
                disabled={saving}
              >
                Limpiar todo
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {alergias.map((alergia, index) => (
              <div
                key={`${alergia}-${index}`}
                className="group relative"
              >
                {editingIndex === index ? (
                  <input
                    type="text"
                    defaultValue={alergia}
                    onBlur={(e) => handleEditAlergia(index, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleEditAlergia(index, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setEditingIndex(null);
                      }
                    }}
                    className="text-xs px-2 py-1 border border-[#ac9164] rounded-full bg-white"
                    autoFocus
                    disabled={saving}
                  />
                ) : (
                  <span
                    className="inline-block bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-red-200 transition-colors"
                    onClick={() => setEditingIndex(index)}
                    title="Click para editar"
                  >
                    {alergia}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAlergia(index);
                      }}
                      className="ml-2 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={saving}
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {alergias.length === 0 && (
        <div className="text-center py-4 text-[#8e9b6d] bg-[#f6eedb] rounded border-2 border-dashed border-[#d5c7aa]">
          <div className="text-2xl mb-1">🚫</div>
          <div className="text-sm">Sin alergias registradas</div>
        </div>
      )}

      {/* Helper text */}
      <div className="text-xs text-[#8e9b6d]">
        💡 Tip: Puedes escribir múltiples alergias separadas por comas para agregarlas de una vez
      </div>
    </div>
  );
});

AlergiasField.displayName = 'AlergiasField';

export default AlergiasField;