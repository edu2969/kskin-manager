import React, { memo, useState } from 'react';
import { AnamnesisFormData, Parto } from '../../types';
import { useSaveField } from '../../hooks/useSaveField';
import { useSupportingData } from '../../hooks/useFicha';
import { FaCaretSquareRight } from 'react-icons/fa';
import AntecedentesMorbidos from '../forms/AntecedentesMorbidos';

interface AnamnesisTabProps {
  pacienteId: string;
  data: AnamnesisFormData;
  isActive: boolean;
}

const AnamnesisTab: React.FC<AnamnesisTabProps> = memo(({ 
  pacienteId, 
  data, 
  isActive 
}) => {
  const { mutate: saveField, saving, error } = useSaveField(pacienteId);
  const { antecedentes } = useSupportingData();
  
  // Local state for form inputs
  const [anamnesisText, setAnamnesisText] = useState(data.anamnesis || '');
  const [operacionesText, setOperacionesText] = useState(data.operaciones || '');

  // Memoized computed values - ALL HOOKS MUST BE AT TOP LEVEL
  const partoTypeOptions = React.useMemo(() => [
    { value: 'VAGINAL', label: 'Vaginal' },
    { value: 'CESAREA', label: 'Cesárea' },
    { value: 'ABORTO', label: 'Aborto' }
  ], []);

  const genderOptions = React.useMemo(() => [
    { value: '', label: '-' },
    { value: 'M', label: 'M' },
    { value: 'F', label: 'F' }
  ], []);

  const hasPartos = React.useMemo(() => data.partos.length > 0, [data.partos.length]);

  const handleAnamnesisBlur = React.useCallback(() => {
    if (anamnesisText !== data.anamnesis) {
      saveField('anamnesis', anamnesisText);
    }
  }, [anamnesisText, data.anamnesis, saveField]);

  const handleOperacionesBlur = React.useCallback(() => {
    if (operacionesText !== data.operaciones) {
      saveField('operaciones', operacionesText);
    }
  }, [operacionesText, data.operaciones, saveField]);

  const handleHigieneChange = React.useCallback((field: string, value: unknown) => {
    const updated = { ...data.higiene, [field]: value };
    saveField('higiene', updated);
  }, [data.higiene, saveField]);

  const handlePartoAdd = React.useCallback(() => {
    const newParto: Parto = {
      tipoParto: 'VAGINAL',
      fecha: new Date(),
      meses: 9,
      genero: ''
    };
    const updated = [...data.partos, newParto];
    saveField('partos', updated);
  }, [data.partos, saveField]);

  const handlePartoUpdate = React.useCallback((index: number, updates: Partial<Parto>) => {
    const updated = [...data.partos];
    updated[index] = { ...updated[index], ...updates };
    saveField('partos', updated);
  }, [data.partos, saveField]);

  const handlePartoRemove = React.useCallback((index: number) => {
    const updated = data.partos.filter((_, i) => i !== index);
    saveField('partos', updated);
  }, [data.partos, saveField]);

  // Early return if not active - AFTER ALL HOOKS
  if (!isActive) {
    return <div className="hidden" />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#6a3858] mb-4">
        Anamnesis / Exámen Físico
        {saving && <span className="ml-2 text-sm text-blue-500">Guardando...</span>}
        {error && <span className="ml-2 text-sm text-red-500">Error al guardar</span>}
      </h2>

      {/* Anamnesis Description */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <h3 className="text-lg font-bold text-[#6a3858] mb-3">Descripción Clínica</h3>
        <textarea
          className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-32 focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
          value={anamnesisText}
          onChange={(e) => setAnamnesisText(e.target.value)}
          onBlur={handleAnamnesisBlur}
          placeholder="Describa la anamnesis y hallazgos del examen físico..."
        />
      </div>

      {/* Antecedentes Mórbidos */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
          <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">
              <FaCaretSquareRight size="1.2rem"/>
            </span>
            Antecedentes Mórbidos
          </summary>
          <div className="mt-4">
            <AntecedentesMorbidos
              pacienteId={pacienteId}
              antecedentes={data.antecedenteMorbidos}
              isLoading={antecedentes.isLoading}
            />
          </div>
        </details>
      </div>

      {/* Operaciones */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
          <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">
              <FaCaretSquareRight size="1.2rem"/>
            </span>
            Operaciones
          </summary>
          <div className="mt-4">
            <textarea
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-24 focus:border-[#ac9164]"
              value={operacionesText}
              onChange={(e) => setOperacionesText(e.target.value)}
              onBlur={handleOperacionesBlur}
              placeholder="Detalle de operaciones quirúrgicas..."
            />
          </div>
        </details>
      </div>

      {/* Partos */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
          <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">
              <FaCaretSquareRight size="1.2rem"/>
            </span>
            Partos
          </summary>
          <div className="mt-4">
            <button 
              onClick={handlePartoAdd}
              className="mb-4 bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]"
            >
              Agregar Parto
            </button>
            
            {hasPartos && (
              <div className="space-y-3">
                {data.partos.map((parto, index) => (
                  <div key={index} className="border border-[#d5c7aa] rounded p-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-[#68563c]">Tipo</label>
                        <select
                          value={parto.tipoParto}
                          onChange={(e) => handlePartoUpdate(index, { 
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
                          onChange={(e) => handlePartoUpdate(index, { 
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
                          onChange={(e) => handlePartoUpdate(index, { 
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
                            onChange={(e) => handlePartoUpdate(index, { genero: e.target.value })}
                            className="flex-1 border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                          >
                            {genderOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handlePartoRemove(index)}
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
        </details>
      </div>

      {/* Hábitos de Higiene */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
          <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">
              <FaCaretSquareRight size="1.2rem"/>
            </span>
            Hábitos de Higiene
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.higiene.fuma}
                    onChange={(e) => handleHigieneChange('fuma', e.target.checked)}
                    className="text-[#ac9164]"
                  />
                  <span className="text-sm text-[#68563c]">Fuma</span>
                </label>
              </div>
              <div>
                <label className="text-sm text-[#68563c]">Agua (ml/día)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={data.higiene.agua}
                  onChange={(e) => handleHigieneChange('agua', parseInt(e.target.value) || 0)}
                  className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#68563c]">Ejercicio (hrs/semana)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={data.higiene.ejercicioSemanal}
                  onChange={(e) => handleHigieneChange('ejercicioSemanal', parseFloat(e.target.value) || 0)}
                  className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#68563c]">Nivel de estrés (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={data.higiene.nivelStress}
                  onChange={(e) => handleHigieneChange('nivelStress', parseInt(e.target.value) || 1)}
                  className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-[#68563c]">Calidad de sueño (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={data.higiene.calidadDormir}
                  onChange={(e) => handleHigieneChange('calidadDormir', parseInt(e.target.value) || 1)}
                  className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-[#68563c]">Hábito alimenticio</label>
              <textarea
                value={data.higiene.habitoAlimenticio}
                onChange={(e) => handleHigieneChange('habitoAlimenticio', e.target.value)}
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-20 focus:border-[#ac9164] text-sm"
                placeholder="Describe los hábitos alimenticios del paciente..."
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
});

AnamnesisTab.displayName = 'AnamnesisTab';

export default AnamnesisTab;