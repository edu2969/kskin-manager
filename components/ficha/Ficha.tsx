"use client"

import { useEffect, useState, useCallback } from "react";
import { CiPower } from "react-icons/ci";
import { useRouter } from "next/navigation";
import Loader from "../Loader";
import HistoricoFichas from "../HistoricoFichas";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import ModalConfirmacionSalir from "./modals/ModalConfirmacionSalir";
import EncabezadoFicha from "./EncabezadoFicha";
import Indicaciones from "./Indicaciones";
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

const TABS_MEDICO = [
    { key: "personal", label: "Información personal", color: "pink" },
    { key: "anamnesis", label: "Anamnesis / Exámen Físico", color: "purple" },
    { key: "examenes", label: "Exámenes", color: "purple" },
    { key: "indicaciones", label: "Indicaciones", color: "sky" },
    { key: "receta", label: "Receta", color: "green" },
    { key: "licencias", label: "Licencias", color: "purple" },
];

const TABS_OTROS = [
    { key: "personal", label: "Información personal", color: "pink" },
    { key: "indicaciones", label: "Indicaciones", color: "sky" },
];

export default function Ficha({ pacienteId, fichaId }: {
    pacienteId: string | null;
    fichaId: string | null;
}) {
    const [tab, setTab] = useState("personal");
    const [showHistorico, setShowHistorico] = useState(false);    
    const [finishing, setFinishing] = useState(false);
    const { register, control, setValue, reset } = useForm<IFichaForm>({
        defaultValues: {
            anamnesis: "",
            indicaciones: "",
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
                horasEjerciciosSemanales: 0,
                nivelEstres: "",
                calidadDormir: "",
                habitoAlimenticio: ""
            }
        }
    });
    const [showTooltip, setShowTooltip] = useState(false);
    const [showModalSalir, setShowModalSalir] = useState(false);
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
            return data;
        }
    });

    // Cargar valores por defecto del formulario cuando la ficha se carga
    useEffect(() => {
        if (ficha) {
            const formData: IFichaForm = {
                anamnesis: ficha.tratamiento || "",
                indicaciones: ficha.indicaciones || "",
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
                    alergias: Array.isArray(ficha.paciente?.alergias) 
                        ? ficha.paciente.alergias.join(", ") 
                        : ficha.paciente?.alergias || "",
                    medicamentos: "",
                    otroAnticonceptivo: "",
                    otroMedicamento: "",
                    otroAntecedente: ficha.paciente?.antecedentesAdicionales || ""
                },
                metodosAnticonceptivos: ficha.paciente?.metodosAnticonceptivos || [],
                medicamentos: ficha.paciente?.medicamentos?.map((m: any) => ({
                    nombre: m.nombre,
                    unidades: m.unidades,
                    frecuencia: m.frecuencia
                })) || [],
                antecedentes: ficha.paciente?.antecedentes || [],
                partos: ficha.paciente?.partos?.map((p: any, index: number) => ({
                    numero: index + 1,
                    fecha: p.fecha ? new Date(p.fecha).toISOString().split('T')[0] : "",
                    genero: p.genero || "",
                    tipo: p.tipo || ""
                })) || [],
                higiene: {
                    cantidadCigarrillosSemanales: ficha.higiene?.cantidad_cigarrillos_semanales || 0,
                    aguaConsumidaDiariaLitros: ficha.higiene?.agua_consumida_diaria_litros || 0,
                    horasEjerciciosSemanales: ficha.higiene?.horas_ejercicio_semanales || 0,
                    nivelEstres: ficha.higiene?.nivel_estres || "",
                    calidadDormir: ficha.higiene?.calidad_dormir || "",
                    habitoAlimenticio: ficha.higiene?.habito_alimenticio || ""
                }
            };
            
            reset(formData);
            console.log("📝 Formulario cargado con valores por defecto:", formData);
        }
    }, [ficha, reset]);

    const mutationGuardarAtributo = useMutation({
        mutationFn: async ({ atributo, valor }: { atributo: string; valor: string }) => {
            const resp = await fetch("/api/profesional/actualizarFicha", {
                method: "POST",
                body: JSON.stringify({
                    atributo,
                    valor,
                    fichaId: ficha?.id
                })
            });
            const data = await resp.json();
            if (!data.ok) {
                throw new Error(data.error || "Error guardando atributo");
            }
            return data;
        }
    });
        
    const onChange = (atributo: string, valor: string | number | boolean) => {
        mutationGuardarAtributo.mutate({ atributo, valor: String(valor) });
    }

    const esMedico = () => {
        const profesional = ficha?.profesional;
        if (!profesional || !profesional.especialidades || !profesional.especialidades.length) {
            return false;
        }
        return profesional.especialidades.some((esp: string) =>
            esp === 'medicina'
        );
    }

    // Función para determinar qué tabs mostrar según especialidad
    const getTabsSegunEspecialidad = useCallback(() => {
        return esMedico() ? TABS_MEDICO : TABS_OTROS;
    }, [ficha?.profesional]);    

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
                }
            });
        }
    });

    const handleTerminarAtencion = async () => {
        mutationTerminarAtencion.mutate();
    }

    return (
        <div className="relative p-1 md:p-2 bg-gradient-to-br from-[#A78D60] via-[#EFC974] to-[#A48A60] h-screen">
            {mutationGuardarAtributo.isPending && (
                <div className="absolute top-2 right-4 bg-[#66754c] text-white px-3 py-1 rounded shadow animate-pulse z-20">
                    Guardando...
                </div>
            )}

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
                                onChange={onChange}
                                genero={ficha?.paciente?.genero || ""}
                                esMedico={esMedico()} />}

                        {tab === "anamnesis" && <Anamnesis
                                register={register}
                            />}

                        {tab === "examenes" && <Examenes
                                register={register}
                            />}

                        {tab === "indicaciones" && <Indicaciones register={register} />}

                        {tab === "receta" && <Receta register={register} />}

                        {tab === "licencias" && <Licencias register={register} />}
                    </div>
                </div>

                {/* Lengüetas verticales tipo carpeta (derecha) */}
                <div className="relative flex flex-row md:flex-col flex-wrap md:flex-nowrap justify-start bg-transparent h-auto md:h-full order-1 md:order-2 md:-ml-0.5 z-20 w-full md:w-auto md:max-w-[220px] gap-2 md:gap-0 px-2 md:px-0">
                    {getTabsSegunEspecialidad().map((t, index) => {
                        const isActive = tab === t.key;
                        const isLast = index === getTabsSegunEspecialidad().length - 1;
                        const isFirst = index === 0;
                        return (
                            <button
                                key={t.key}
                                className={`
                                    ${isLast ? 'md:h-full' : 'md:h-32'} h-auto ${isFirst ? 'md:mt-0' : '-ml-3 md:-mt-3 md:ml-0'} 
                                    inline-flex md:block items-center relative px-3 md:px-4 py-2 md:pt-6 text-md font-semibold w-auto md:w-full md:min-w-[200px]
                                    border border-[#d5c7aa] md:border-l-0 rounded-tl-lg md:rounded-tl-none md:rounded-tr-lg 
                                    ${isLast && 'md:rounded-br-lg'} 
                                    ${isActive
                                        ? "text-[#68563c] bg-[#f6eedb] md:border-l-0 rounded-t-lg md:rounded-none z-30 shadow-sm"
                                        : "text-[#8e9b6d] bg-white hover:bg-[#ac9164] hover:text-white md:border-l-2 md:border-l-[#d5c7aa] hover:md:border-l-[#ac9164] cursor-pointer rounded-t-lg md:rounded-none z-10"
                                    }
                                    text-left md:text-left transition-all duration-200 whitespace-nowrap
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

            </>}
            
            <HistoricoFichas
                paciente={ficha?.paciente || null}
                isOpen={showHistorico}
                onClose={() => setShowHistorico(false)}
            />

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
                    onClick={() => setShowModalSalir(true)}
                >
                    {/* SVG CiPower logo (placeholder) */}
                    <CiPower className="text-3xl text-[#68563c]" />
                </button>
            </div>



            <ModalConfirmacionSalir
                isOpen={showModalSalir}
                onClose={() => setShowModalSalir(false)}
                terminarAtencion={handleTerminarAtencion}
            />

            {/* Overlay de finalización */}
            {finishing && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-xl border border-[#d5c7aa]">
                    <Loader texto="Finalizando la atención..." />
                </div>
            </div>}
        </div>
    );
}