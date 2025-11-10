import React, { memo, useMemo } from 'react';
import { Parto } from '../../types';

interface PartosFormProps {
  partos: Parto[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<Parto>) => void;
  onRemove: (index: number) => void;
}

const PartosForm: React.FC<PartosFormProps> = memo(({
  partos,
  onAdd,
  onUpdate,
  onRemove
}) => {
  // Memoized options
  const partoTypeOptions = useMemo(() => [
    { value: 'VAGINAL', label: 'Vaginal' },
    { value: 'CESAREA', label: 'Cesárea' },
    { value: 'ABORTO', label: 'Aborto' }
  ], []);

  const genderOptions = useMemo(() => [
    { value: '', label: '-' },
    { value: 'M', label: 'M' },
    { value: 'F', label: 'F' }
  ], []);

  const hasPartos = useMemo(() => partos.length > 0, [partos.length]);

  return (
    <div className="mt-4">
      <button 
        onClick={onAdd}
        className="mb-4 bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]"
      >
        Agregar Parto
      </button>
      
      {hasPartos && (
        <div className="space-y-3">
          {partos.map((parto, index) => (
            <div key={index} className="border border-[#d5c7aa] rounded p-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-[#68563c]">Tipo</label>
                  <select
                    value={parto.tipoParto}
                    onChange={(e) => onUpdate(index, { 
                      tipoParto: e.target.value as 'VAGINAL' | 'CESAREA' | 'ABORTO' 
                    })}
                    className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                  >
                    {partoTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#68563c]">Fecha</label>
                  <input
                    type="date"
                    value={parto.fecha ? new Date(parto.fecha).toISOString().split('T')[0] : ''}
                    onChange={(e) => onUpdate(index, { 
                      fecha: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#68563c]">Meses</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={parto.meses || ''}
                    onChange={(e) => onUpdate(index, { 
                      meses: parseInt(e.target.value) || undefined 
                    })}
                    className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#68563c]">Género</label>
                  <div className="flex gap-1">
                    <select
                      value={parto.genero || ''}
                      onChange={(e) => onUpdate(index, { genero: e.target.value })}
                      className="flex-1 border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                    >
                      {genderOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => onRemove(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

PartosForm.displayName = 'PartosForm';

export default PartosForm;