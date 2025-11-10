import React, { memo, useState } from 'react';
import { ExamenesFormData, ExamenInfo } from '../../types';
import { useSaveField } from '../../hooks/useSaveField';
import { useSupportingData } from '../../hooks/useFicha';

interface ExamenesTabProps {
  pacienteId: string;
  data: ExamenesFormData;
  isActive: boolean;
}

// Utility function to flatten exam hierarchy
const flattenExamenes = (examenes: ExamenInfo[]): Array<{ codigo: string; nombre: string }> => {
  let flat: Array<{ codigo: string; nombre: string }> = [];
  
  for (const ex of examenes) {
    if (ex.sub && ex.sub.length > 0) {
      flat = flat.concat(
        ex.sub.map((s) => ({
          codigo: s.codigo,
          nombre: `${ex.nombre} - ${s.nombre}`,
        }))
      );
    } else {
      flat.push({ codigo: ex.codigo, nombre: ex.nombre });
    }
  }
  
  return flat;
};

const ExamenesTab: React.FC<ExamenesTabProps> = memo(({ 
  pacienteId, 
  data, 
  isActive 
}) => {
  const { mutate: saveField, saving, error } = useSaveField(pacienteId);
  const { examenes } = useSupportingData();
  
  const [examenInput, setExamenInput] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Flatten examenes for autocomplete - ALL HOOKS AT TOP LEVEL
  const examenesFlat = React.useMemo(() => {
    return examenes.data ? flattenExamenes(examenes.data) : [];
  }, [examenes.data]);

  // Filter examenes for autocomplete
  const filteredExamenes = React.useMemo(() => {
    if (!examenInput || examenInput.length < 2) return [];
    
    return examenesFlat.filter(ex => 
      ex.nombre.toLowerCase().includes(examenInput.toLowerCase()) ||
      ex.codigo.toLowerCase().includes(examenInput.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
  }, [examenesFlat, examenInput]);

  const handleAddExamen = React.useCallback((examen: string) => {
    if (!examen.trim() || data.solicitudExamenes.includes(examen)) return;
    
    const updated = [...data.solicitudExamenes, examen.trim()];
    saveField('solicitudExamenes', updated);
    setExamenInput('');
    setShowAutocomplete(false);
  }, [data.solicitudExamenes, saveField]);

  const handleRemoveExamen = React.useCallback((index: number) => {
    const updated = data.solicitudExamenes.filter((_, i) => i !== index);
    saveField('solicitudExamenes', updated);
  }, [data.solicitudExamenes, saveField]);

  const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredExamenes.length > 0) {
        handleAddExamen(filteredExamenes[0].codigo);
      } else if (examenInput.trim()) {
        handleAddExamen(examenInput);
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  }, [filteredExamenes, examenInput, handleAddExamen]);

  // Early return if not active - AFTER ALL HOOKS
  if (!isActive) {
    return <div className="hidden" />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#6a3858] mb-4">
        Exámenes
        {saving && <span className="ml-2 text-sm text-blue-500">Guardando...</span>}
        {error && <span className="ml-2 text-sm text-red-500">Error al guardar</span>}
      </h2>

      {/* Exam Request Form */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <h3 className="text-lg font-bold text-[#6a3858] mb-3">Solicitud de exámenes</h3>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={examenInput}
              onChange={(e) => {
                setExamenInput(e.target.value);
                setShowAutocomplete(e.target.value.length >= 2);
              }}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setShowAutocomplete(examenInput.length >= 2)}
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
              placeholder="Buscar examen por nombre o código..."
            />
            
            {/* Autocomplete dropdown */}
            {showAutocomplete && filteredExamenes.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-[#d5c7aa] rounded-b shadow-lg max-h-48 overflow-y-auto">
                {filteredExamenes.map((examen, index) => (
                  <button
                    key={`${examen.codigo}-${index}`}
                    onClick={() => handleAddExamen(examen.codigo)}
                    className="w-full text-left px-3 py-2 hover:bg-[#f6eedb] focus:bg-[#f6eedb] text-sm"
                  >
                    <div className="font-medium text-[#68563c]">{examen.codigo}</div>
                    <div className="text-xs text-[#8e9b6d]">{examen.nombre}</div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Loading state */}
            {examenes.isLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-4 w-4 border-2 border-[#ac9164] border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleAddExamen(examenInput)}
            disabled={!examenInput.trim()}
            className="px-4 py-2 bg-[#66754c] text-white rounded hover:bg-[#8e9b6d] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </div>

        {/* Selected exams list */}
        {data.solicitudExamenes.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-[#68563c] mb-2">
              Exámenes solicitados ({data.solicitudExamenes.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.solicitudExamenes.map((examen, index) => {
                const examenInfo = examenesFlat.find(e => e.codigo === examen);
                return (
                  <div
                    key={`${examen}-${index}`}
                    className="flex items-center justify-between p-3 bg-[#f6eedb] rounded border border-[#d5c7aa]"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[#68563c]">{examen}</div>
                      {examenInfo && (
                        <div className="text-sm text-[#8e9b6d]">{examenInfo.nombre}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveExamen(index)}
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      title="Eliminar examen"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.solicitudExamenes.length === 0 && (
          <div className="text-center py-8 text-[#8e9b6d]">
            <div className="text-4xl mb-2">🔬</div>
            <div>No hay exámenes solicitados</div>
            <div className="text-sm">Comience escribiendo el nombre o código del examen</div>
          </div>
        )}
      </div>

      {/* Quick access to common exams */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <h3 className="text-lg font-bold text-[#6a3858] mb-3">Exámenes Frecuentes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { codigo: 'HMG', nombre: 'Hemograma' },
            { codigo: 'GLU', nombre: 'Glicemia' },
            { codigo: 'URO', nombre: 'Urocultivo' },
            { codigo: 'ECG', nombre: 'Electrocardiograma' },
            { codigo: 'RXT', nombre: 'Radiografía de Tórax' },
            { codigo: 'TSH', nombre: 'Hormona Estimulante del Tiroides' },
          ].map((examen) => (
            <button
              key={examen.codigo}
              onClick={() => handleAddExamen(examen.codigo)}
              disabled={data.solicitudExamenes.includes(examen.codigo)}
              className="p-2 text-left border border-[#d5c7aa] rounded hover:bg-[#f6eedb] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-[#68563c]">{examen.codigo}</div>
              <div className="text-xs text-[#8e9b6d]">{examen.nombre}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Export/Print options */}
      {data.solicitudExamenes.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
          <h3 className="text-lg font-bold text-[#6a3858] mb-3">Acciones</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const examList = data.solicitudExamenes.join('\n');
                navigator.clipboard.writeText(examList);
                // You could add a toast notification here
              }}
              className="px-4 py-2 bg-[#ac9164] text-white rounded hover:bg-[#68563c]"
            >
              📋 Copiar Lista
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 bg-[#66754c] text-white rounded hover:bg-[#8e9b6d]"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ExamenesTab.displayName = 'ExamenesTab';

export default ExamenesTab;