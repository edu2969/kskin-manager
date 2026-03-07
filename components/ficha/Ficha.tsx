"use client"

import { useEffect, useState, useCallback } from "react";
import { CiPower } from "react-icons/ci";
import { useRouter } from "next/navigation";
import Loader from "../Loader";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import ModalConfirmacionSalir from "./modals/ModalConfirmacionSalir";
import ModalAlertaAlergias from "./modals/ModalAlertaAlergias";
import EncabezadoFicha from "./EncabezadoFicha";
import Tratamiento from "./Tratamiento";
import { useForm } from "react-hook-form";
import InformacionPersonal from "./InformacionPersonal";
import Anamnesis from "./Anamnesis";
import { useMutation, useQuery } from "@tanstack/react-query";
import Examenes from "./Examenes";
import Receta from "./Receta";
import Licencias from "./Licencias";
dayjs.locale('es');
dayjs.extend(relativeTime);
import type { IFichaForm } from "./types";
import { AutoSaveProvider } from "@/providers/AutoSaveProvider";
import { AutoSaveIndicator } from "../prefabs/AutoSaveIndicator";
import MotivoConsulta from "./MotivoConsulta";
import { AntecedentesAdicionales } from "./AntecedentesAdicionales";

const TABS_MEDICO = [
    { key: "personal", label: "Información personal", color: "pink" },
    { key: "motivo", label: "Motivo de Consulta", color: "purple" },
    { key: "anamnesis", label: "Anamnesis / Exámen Físico", color: "purple" },
    { key: "examenes", label: "Exámenes", color: "purple" },
    { key: "indicaciones", label: "Indicaciones", color: "sky" },
    { key: "receta", label: "Receta", color: "green" },
    { key: "licencias", label: "Licencias", color: "purple" },
];

const TABS_OTROS = [
    { key: "personal", label: "Información personal", color: "pink" },
    { key: "motivo", label: "Motivo de Consulta", color: "purple" },
    { key: "anamnesis", label: "Anamnesis / Exámen Físico", color: "purple" },
    { key: "antecedentes_adicionales", label: "Antecedentes adicionales", color: "purple" },
    { key: "indicaciones", label: "Indicaciones", color: "sky" },
];

export default function Ficha({ pacienteId, fichaId }: {
    pacienteId: string | null;
    fichaId: string | null;
}) {
    const [tab, setTab] = useState("personal");    
    const formMethods = useForm<IFichaForm>({
        defaultValues: {
            anamnesis: "",
            receta: "",
            tratamiento: "",
            motivoConsulta: "",
            examenes: "",            
            paciente: {
                nombres: "",
                apellidos: "",
                numeroIdentidad: "",
                genero: "",
                sistemaSaludId: 0,
                telefono: "",
                email: "",
                direccion: "",
                fechaNacimiento: "",
                alergias: "",
                medicamentos: "",
                operaciones: "",
                antecedentesAdicionales: "",
                otroAnticonceptivo: "",
                otroMedicamento: "",
                otroAntecedente: ""
            },
            metodosAnticonceptivos: [],
            medicamentos: [],
            antecedentes: [],
            partos: [],
            higiene: {
                cantidadCigarrillosSemanales: 0,
                aguaConsumidaDiariaLitros: 0,
                horasEjercicioSemanales: 0,
                nivelEstres: "",
                calidadDormir: "",
                habitoAlimenticio: ""
            }
        }
    });
    
    const { register, control, setValue, reset } = formMethods;
    const [showTooltip, setShowTooltip] = useState(false);
    const [showModalSalir, setShowModalSalir] = useState(false);
    const [showAlertaAlergias, setShowAlertaAlergias] = useState(false);
    const router = useRouter();

    const { data: ficha, isLoading: loadingFicha } = useQuery({
        queryKey: ['ficha', pacienteId, fichaId],
        queryFn: async () => {
            if (!pacienteId && !fichaId) {
                return null;
            }
            const res = await fetch(`/api/paciente/ficha?pacienteId=${pacienteId}&fichaId=${fichaId}`);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al cargar la ficha');
            }    
            console.log("📡 Ficha obtenida:", data);        
            return data;
        }
    });

    useEffect(() => {
        if (ficha) {
            const formData: IFichaForm = {
                anamnesis: ficha.anamnesis || "",
                receta: ficha.receta || "",
                tratamiento: ficha.tratamiento || "",
                motivoConsulta: ficha.motivoConsulta || "",                
                examenes: ficha.examenes || "",
                paciente: {
                    nombres: ficha.paciente?.nombres || "",
                    apellidos: ficha.paciente?.apellidos || "",
                    numeroIdentidad: ficha.paciente?.numeroIdentidad || "",
                    genero: ficha.paciente?.genero || "",
                    sistemaSaludId: ficha.paciente?.sistemaSaludId,
                    telefono: ficha.paciente?.telefono || "",
                    email: ficha.paciente?.email || "",
                    direccion: ficha.paciente?.direccion || "",
                    fechaNacimiento: ficha.paciente?.fechaNacimiento 
                        ? new Date(ficha.paciente.fechaNacimiento).toISOString().split('T')[0] 
                        : "",
                    alergias: ficha.paciente.alergias,
                    medicamentos: "",
                    operaciones: ficha.paciente?.operaciones || "",
                    antecedentesAdicionales: ficha.paciente?.antecedentesAdicionales || "",
                    ocupacion: ficha.paciente?.ocupacion || "",
                    otroAnticonceptivo: "",
                    otroMedicamento: "",
                    otroAntecedente: ficha.paciente?.antecedentesAdicionales || ""
                },
                metodosAnticonceptivos: ficha.paciente?.metodosAnticonceptivos?.map((m: {
                    anticonceptivoId: string;
                    metodoAnticonceptivoId: number;
                }) => ({
                    anticonceptivoId: m.anticonceptivoId, // Este campo ya viene mapeado desde el backend
                    pacienteId: undefined, // No necesario en formulario
                    metodoAnticonceptivoId: m.metodoAnticonceptivoId
                })) || [],
                medicamentos: (ficha.medicamentos || ficha.paciente?.medicamentos || []).map((m: {
                    relacionId?: string;
                    medicamentoId?: string;
                    medicamento_id?: string;
                }) => ({
                    relacionId: m.relacionId || m.medicamentoId || m.medicamento_id || null,
                    medicamentoId: m.medicamentoId || m.medicamento_id || ""
                })).filter((m: { medicamentoId: string }) => Boolean(m.medicamentoId)),
                antecedentes: ficha.paciente?.antecedentes || [],
                partos: ficha.paciente?.partos?.map((p: {
                    partoId: string;
                    fecha: string;
                    genero: string;
                    tipo: string;
                }) => ({
                    partoId: p.partoId,  // ✅ CRÍTICO: Preservar el ID del parto
                    pacienteId: undefined,  // No necesario en formulario
                    fecha: p.fecha ? new Date(p.fecha).toISOString().split('T')[0] : "",
                    genero: p.genero || "",
                    tipo: p.tipo || ""
                })) || [],
                higiene: {
                    ipa: ficha.higiene?.ipa || 0,
                    cantidadCigarrillosSemanales: ficha.higiene?.cantidadCigarrillosSemanales || 0,
                    aguaConsumidaDiariaLitros: ficha.higiene?.aguaConsumidaDiariaLitros || 0,
                    horasEjercicioSemanales: ficha.higiene?.horasEjercicioSemanales || 0,
                    nivelEstres: ficha.higiene?.nivelEstres || "",
                    calidadDormir: ficha.higiene?.calidadDormir || "",
                    habitoAlimenticio: ficha.higiene?.habitoAlimenticio || ""
                }
            };
            
            reset(formData);            
            
            if (ficha.paciente?.alergias === null) {
                setShowAlertaAlergias(true);
            }
        }
    }, [ficha, formMethods.reset]);

    const esMedico = useCallback(() => {        
        const profesional = ficha?.profesional;
        if (!profesional || !profesional.especialidades || !profesional.especialidades.length) {
            return false;
        }
        return profesional.especialidades.some((esp: { nombre: string }) => {            
            return esp.nombre === 'Medicina';
        });
    }, [ficha?.profesional]);

    // Función para determinar qué tabs mostrar según especialidad
    const getTabsSegunEspecialidad = useCallback(() => {
        return esMedico() ? TABS_MEDICO : TABS_OTROS;
    }, [esMedico]);    

    // Cambiar a primer tab disponible si el actual no está permitido
    useEffect(() => {
        const profesional = ficha?.profesional;
        if (profesional) {
            const tabsPermitidos = getTabsSegunEspecialidad();
            const tabActualPermitido = tabsPermitidos.some(t => t.key === tab);

            if (!tabActualPermitido) {
                setTab(tabsPermitidos[0].key);
                console.log(`Tab '${tab}' no permitido para especialidad, cambiando a '${tabsPermitidos[0].key}'`);
            }
        }
    }, [ficha?.profesional, tab, getTabsSegunEspecialidad]);

    const mutationTerminarAtencion = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/profesional/terminarAtencion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pacienteId
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al terminar la atención');
            }
            return data;
        },
        onSuccess: () => {
            router.back();
        }
    });

    const handleTerminarAtencion = async () => {
        if(pacienteId) {
            setShowModalSalir(true);
            return;
        }
        router.back();
    }

    const handleRegistrarTerminoAtencion = async () => {
        mutationTerminarAtencion.mutate();        
    }

    return (<AutoSaveProvider 
        fichaId={ficha?.id} 
        pacienteId={pacienteId || undefined}
        formMethods={formMethods}
    >
        <div className="relative p-1 md:p-2 bg-gradient-to-br from-[#A78D60] via-[#EFC974] to-[#A48A60] h-screen">
            <AutoSaveIndicator />

            {/* Loader Ficha Inicial */}
            {loadingFicha && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A78D60] mb-4"></div>
                        <div className="text-[#68563c] font-medium text-lg">Cargando ficha...</div>
                    </div>
                </div>
            )}

            {!loadingFicha && ficha && <>
                <EncabezadoFicha paciente={ficha.paciente} profesional={{
                    id: ficha?.profesional?.id || "",
                    nombre: ficha?.profesional?.nombre || "",
                    email: ficha?.profesional?.email || "",
                    especialidades: ficha?.profesional?.especialidades?.map((e: {
                        nombre: string;
                    }) => e.nombre) || []
                }} />

                <div className="flex flex-col md:flex-row h-[calc(100vh-166px)] relative">
                {/* Contenido (izquierda) - Conectado con tab activo */}
                <div className="flex-1 order-2 md:order-1 bg-[#f6eedb] shadow border border-r-0 border-[#d5c7aa] overflow-y-auto relative z-10"
                    style={{
                        borderTopLeftRadius: '0.75rem',
                        borderBottomLeftRadius: '0.75rem'
                    }}>
                    <div className="p-6">
                        {tab === "personal" && <InformacionPersonal
                                register={register}
                                setValue={setValue}
                                control={control}
                                genero={ficha?.paciente?.genero || ""}
                                esMedico={esMedico()}
                                alertaAlergias={ficha?.paciente?.alergias === null} />}

                        {tab === "motivo" && <MotivoConsulta 
                            register={register} />}

                        {tab === "anamnesis" && <Anamnesis
                                register={register}
                            />}

                        {tab === "antecedentes_adicionales" && <AntecedentesAdicionales
                            register={register}
                        />}

                        {tab === "examenes" && <Examenes
                                register={register}
                            />}

                        {tab === "indicaciones" && <Tratamiento register={register} />}

                        {tab === "receta" && <Receta register={register} />}

                        {tab === "licencias" && <Licencias />}
                    </div>
                </div>

                {/* Lengüetas verticales tipo carpeta (derecha) */}
                <div className="relative bg-transparent h-auto md:h-full order-1 md:order-2 md:-ml-0.5 z-20 w-full md:w-auto md:max-w-[220px] px-2 md:px-0">
                    
                    {/* Mobile: Tabs en orden invertido - arriba los últimos, abajo los primeros */}
                    <div className="md:hidden flex flex-col">
                        {/* Segunda mitad de tabs - van ARRIBA */}
                        {getTabsSegunEspecialidad().length > 3 && (
                            <div className="flex flex-row -space-x-1 -mb-1">
                                {getTabsSegunEspecialidad().slice(3).map((t, index) => {
                                    const isActive = tab === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            className={`
                                                relative px-2 py-2 text-xs font-semibold flex-1 min-w-0
                                                border border-[#d5c7aa] transition-all duration-200
                                                rounded-t-lg
                                                ${isActive
                                                    ? "text-[#68563c] bg-[#f6eedb] border-[#ac9164] z-5"
                                                    : "text-[#8e9b6d] bg-white hover:bg-[#ac9164] hover:text-white cursor-pointer z-0"
                                                }
                                                ${index > 0 ? '-ml-px' : ''}
                                            `}
                                            style={{
                                                borderBottomLeftRadius: '0',
                                                borderBottomRightRadius: '0'
                                            }}
                                            onClick={() => setTab(t.key)}
                                            type="button"
                                            tabIndex={isActive ? 0 : -1}
                                        >
                                            <span className="truncate block leading-tight">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Primera mitad de tabs - van ABAJO, conectando al contenido */}
                        <div className="flex flex-row -space-x-1">
                            {getTabsSegunEspecialidad().slice(0, 3).map((t, index) => {
                                const isActive = tab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        className={`
                                            relative px-2 py-2 text-xs font-semibold flex-1 min-w-0
                                            border-t border-l border-r transition-all duration-200
                                            rounded-t-lg
                                            ${isActive
                                                ? "text-[#68563c] bg-[#f6eedb] border-[#ac9164] z-30"
                                                : "text-[#8e9b6d] bg-white hover:bg-[#ac9164] hover:text-white border-[#d5c7aa] cursor-pointer z-20"
                                            }
                                            ${index > 0 ? '-ml-px' : ''}
                                        `}
                                        style={{
                                            borderBottomLeftRadius: '0',
                                            borderBottomRightRadius: '0',
                                            borderBottom: isActive ? 'none' : '1px solid #d5c7aa'
                                        }}
                                        onClick={() => setTab(t.key)}
                                        type="button"
                                        tabIndex={isActive ? 0 : -1}
                                    >
                                        <span className="truncate block leading-tight">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop: Layout vertical original sin cambios */}
                    <div className="hidden md:block">
                        {getTabsSegunEspecialidad().map((t, index) => {
                            const isActive = tab === t.key;
                            const isLast = index === getTabsSegunEspecialidad().length - 1;
                            const isFirst = index === 0;
                            return (
                                <button
                                    key={t.key}
                                    className={`
                                        ${isLast ? 'md:h-full' : 'md:h-32'} h-auto ${isFirst ? 'md:mt-0' : '-ml-3 md:-mt-3 md:ml-0'} 
                                        md:block items-center relative px-4 pt-6 text-md font-semibold w-full min-w-[200px]
                                        border border-[#d5c7aa] md:border-l-0 rounded-tr-lg 
                                        ${isLast && 'md:rounded-br-lg'} 
                                        ${isActive
                                            ? "text-[#68563c] bg-[#f6eedb] md:border-l-0 z-30 shadow-sm"
                                            : "text-[#8e9b6d] bg-white hover:bg-[#ac9164] hover:text-white md:border-l-2 md:border-l-[#d5c7aa] hover:md:border-l-[#ac9164] cursor-pointer z-10"
                                        }
                                        text-left transition-all duration-200 whitespace-nowrap
                                    `}
                                    style={{
                                        borderBottomLeftRadius: '0'
                                    }}
                                    onClick={() => setTab(t.key)}
                                    type="button"
                                    tabIndex={isActive ? 0 : -1}
                                >
                                    <p className="h-full flex flex-col items-start">{t.label}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            </>}

            <div className="fixed bottom-2 right-2 md:bottom-6 md:right-6 z-50">
                {/* Tooltip */}
                {showTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
                        Finalizar sesión
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                )}

                <button
                    className="bg-white shadow-lg rounded-full p-4 border border-gray-200 hover:bg-pink-100 transition flex items-center justify-center"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => handleTerminarAtencion()}
                >
                    {/* SVG CiPower logo (placeholder) */}
                    <CiPower className="text-3xl text-[#68563c]" />
                </button>
            </div>

            <ModalConfirmacionSalir
                isOpen={showModalSalir}
                onClose={() => setShowModalSalir(false)}
                terminarAtencion={handleRegistrarTerminoAtencion}
            />
            
            <ModalAlertaAlergias
                isOpen={showAlertaAlergias}
                onClose={() => setShowAlertaAlergias(false)}
            />

            {/* Overlay de finalización */}
            {mutationTerminarAtencion.isPending && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-xl border border-[#d5c7aa]">
                    <Loader texto="Finalizando la atención..." />
                </div>
            </div>}
        </div>
    </AutoSaveProvider>);
}