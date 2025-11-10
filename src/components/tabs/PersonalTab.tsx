import React, { memo } from 'react';
import { PersonalFormData, SISTEMA_SALUD_OPTIONS } from '../../types';
import { useSaveField } from '../../hooks/useSaveField';

interface PersonalTabProps {
  pacienteId: string;
  data: PersonalFormData;
  isActive: boolean;
}

const PersonalTab: React.FC<PersonalTabProps> = memo(({ 
  pacienteId, 
  data, 
  isActive 
}) => {
  const { mutate: saveField, saving, error } = useSaveField(pacienteId);

  // ALL HOOKS MUST BE AT TOP LEVEL - BEFORE ANY CONDITIONAL RETURNS
  // Memoized handlers to prevent re-creation on each render
  const handleFieldChange = React.useCallback((field: keyof PersonalFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    saveField(field, value);
  }, [saveField]);

  const handleAlergiasChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const alergias = value.split(',').map(a => a.trim()).filter(a => a);
    saveField('alergias', alergias);
  }, [saveField]);

  // Memoized computed values
  const alergiasDisplay = React.useMemo(() => data.alergias.join(', '), [data.alergias]);
  const hasAlergias = React.useMemo(() => data.alergias.length > 0, [data.alergias]);
  
  // Memoized blood type options to prevent re-creation
  const bloodTypeOptions = React.useMemo(() => [
    { value: '', label: 'Seleccione' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ], []);

  // Early return if not active - AFTER ALL HOOKS
  if (!isActive) {
    return <div className="hidden" />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#6a3858] mb-4">
        Información Personal
        {saving && <span className="ml-2 text-sm text-blue-500">Guardando...</span>}
        {error && <span className="ml-2 text-sm text-red-500">Error al guardar</span>}
      </h2>
      
      {/* Basic Information */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <h3 className="text-lg font-bold text-[#6a3858] mb-3">Datos Básicos</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
              Nombres
            </label>
            <input
              type="text"
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
              defaultValue={data.nombres}
              onBlur={handleFieldChange('nombres')}
              readOnly // Usually names don't change during consultation
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
              Apellidos
            </label>
            <input
              type="text"
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
              defaultValue={data.apellidos}
              onBlur={handleFieldChange('apellidos')}
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
              defaultValue={data.telefono}
              onBlur={handleFieldChange('telefono')}
              placeholder="+56 9 XXXX XXXX"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
              defaultValue={data.email}
              onBlur={handleFieldChange('email')}
              placeholder="paciente@email.com"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-[#68563c] mb-1">
            Dirección
          </label>
          <input
            type="text"
            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
            defaultValue={data.direccion}
            onBlur={handleFieldChange('direccion')}
            placeholder="Dirección completa"
          />
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <h3 className="text-lg font-bold text-[#6a3858] mb-3">Información Médica</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
              Sistema de Salud
            </label>
            <select
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
              value={data.sistemaSalud || ''}
              onChange={handleFieldChange('sistemaSalud')}
            >
              <option value="">Seleccione</option>
              {SISTEMA_SALUD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
              Grupo Sanguíneo
            </label>
            <select
              className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
              defaultValue={data.grupoSanguineo}
              onChange={handleFieldChange('grupoSanguineo')}
            >
              {bloodTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-[#68563c] mb-1">
            Alergias
          </label>
          <input
            type="text"
            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
            defaultValue={alergiasDisplay}
            onBlur={handleAlergiasChange}
            placeholder="Separar múltiples alergias con comas"
          />
          {hasAlergias && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.alergias.map((alergia, index) => (
                <span
                  key={index}
                  className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                >
                  {alergia}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PersonalTab.displayName = 'PersonalTab';

export default PersonalTab;