import React, { useState, useMemo, useCallback, memo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useFicha } from '../hooks/useFicha';
import { TabConfig } from '../types';
import PersonalTab from './tabs/PersonalTab';
import AnamnesisTab from './tabs/AnamnesisTab';
import ExamenesTab from './tabs/ExamenesTab';

interface FichaPacienteProps {
  pacienteId: string;
  especialidad?: string;
}

// Memoized Query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Tab configurations based on especialidad
const TABS_MEDICO: TabConfig[] = [
  { key: 'personal', label: 'Información personal', color: 'pink', component: PersonalTab },
  { key: 'anamnesis', label: 'Anamnesis / Exámen Físico', color: 'purple', component: AnamnesisTab },
  { key: 'examenes', label: 'Exámenes', color: 'purple', component: ExamenesTab },
];

const TABS_OTROS: TabConfig[] = [
  { key: 'personal', label: 'Información personal', color: 'pink', component: PersonalTab },
];

const FichaPacienteContent: React.FC<FichaPacienteProps> = memo(({ pacienteId, especialidad }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const { data, isLoading, error, fichaCompleta } = useFicha(pacienteId);

  // Determine available tabs based on especialidad (memoized)
  const availableTabs = useMemo(() => {
    return especialidad === 'Medico' ? TABS_MEDICO : TABS_OTROS;
  }, [especialidad]);

  // Memoized tab change handler
  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
  }, []);

  // Transform data for tabs
  const tabData = useMemo(() => {
    if (!data) return null;
    
    return {
      personal: {
        nombres: data.paciente.nombres,
        apellidos: data.paciente.apellidos,
        telefono: data.paciente.telefono || '',
        email: data.paciente.email || '',
        direccion: data.paciente.direccion || '',
        sistemaSalud: data.paciente.sistemaSalud,
        grupoSanguineo: data.paciente.grupoSanguineo || '',
        alergias: data.paciente.alergias || [],
      },
      anamnesis: {
        anamnesis: data.ficha?.anamnesis || '',
        operaciones: data.paciente.operaciones || '',
        antecedenteMorbidos: data.paciente.antecedenteMorbidoIds || [],
        medicamentos: data.paciente.medicamentoIds || [],
        partos: data.paciente.partos || [],
        metodoAnticonceptivos: data.paciente.metodoAnticonceptivos || [],
        higiene: data.paciente.higiene || {
          fuma: false,
          agua: 0,
          ejercicioSemanal: 0,
          nivelStress: 1,
          calidadDormir: 1,
          habitoAlimenticio: ''
        },
      },
      examenes: {
        solicitudExamenes: data.ficha?.solicitudExamenes || [],
      },
    };
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <div className="text-red-700 font-medium">Error cargando ficha</div>
          <div className="text-red-600 text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  if (isLoading || !fichaCompleta || !tabData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#ac9164] border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-[#68563c]">Cargando ficha médica...</div>
        </div>
      </div>
    );
  }

  const activeTabConfig = availableTabs.find(tab => tab.key === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  return (
    <div className="flex h-full">
      {/* Content Area */}
      <div className="flex-1 bg-[#f6eedb] border border-[#d5c7aa] rounded-l-lg overflow-y-auto">
        <div className="p-6">
          {ActiveComponent && (
            <ActiveComponent
              pacienteId={pacienteId}
              data={tabData[activeTab as keyof typeof tabData]}
              isActive={true}
            />
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col bg-transparent">
        {availableTabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const isLast = index === availableTabs.length - 1;

          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`
                ${isLast ? 'h-full' : 'h-32'} ${index === 0 ? 'mt-0' : '-mt-4'} 
                relative px-4 pt-6 text-md font-semibold min-w-[200px]
                border border-[#d5c7aa] border-l-0 text-left transition-all duration-200
                ${isActive
                  ? 'text-[#68563c] bg-[#f6eedb] border-l-0'
                  : 'text-[#8e9b6d] bg-white hover:bg-[#ac9164] hover:text-white border-l-2 border-l-[#d5c7aa] hover:border-l-[#ac9164] hover:border-[#ac9164]'
                }
              `}
              style={{
                borderTopRightRadius: '0.75rem',
                borderBottomRightRadius: isLast ? '0.75rem' : '0',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

FichaPacienteContent.displayName = 'FichaPacienteContent';

// Main component with QueryClient provider
const FichaPaciente: React.FC<FichaPacienteProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <FichaPacienteContent {...props} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default FichaPaciente;