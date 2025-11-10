import React, { memo, useCallback } from 'react';
import { Higiene } from '../../types';

interface HigieneFormProps {
  higiene: Higiene;
  onChange: (field: string, value: unknown) => void;
}

const HigieneForm: React.FC<HigieneFormProps> = memo(({
  higiene,
  onChange
}) => {
  const handleFieldChange = useCallback((field: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked
      : event.target.value;
      
    const parsedValue = event.target.type === 'number' 
      ? (event.target.type === 'number' && event.target.value 
          ? ((event.target as HTMLInputElement).step === '0.5' ? parseFloat(event.target.value) : parseInt(event.target.value))
          : 0)
      : value;
      
    onChange(field, parsedValue);
  }, [onChange]);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={higiene.fuma}
              onChange={handleFieldChange('fuma')}
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
            value={higiene.agua}
            onChange={handleFieldChange('agua')}
            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-[#68563c]">Ejercicio (hrs/semana)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={higiene.ejercicioSemanal}
            onChange={handleFieldChange('ejercicioSemanal')}
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
            value={higiene.nivelStress}
            onChange={handleFieldChange('nivelStress')}
            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-[#68563c]">Calidad de sueño (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={higiene.calidadDormir}
            onChange={handleFieldChange('calidadDormir')}
            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm text-[#68563c]">Hábito alimenticio</label>
        <textarea
          value={higiene.habitoAlimenticio}
          onChange={handleFieldChange('habitoAlimenticio')}
          className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-20 focus:border-[#ac9164] text-sm"
          placeholder="Describe los hábitos alimenticios del paciente..."
        />
      </div>
    </div>
  );
});

HigieneForm.displayName = 'HigieneForm';

export default HigieneForm;