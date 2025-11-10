"use client"

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { LiaTimesSolid } from "react-icons/lia";
import { CiPower } from "react-icons/ci";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import Loader from "./Loader";
import HistoricoFichas from "./HistoricoFichas";
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { FaCaretSquareRight } from "react-icons/fa";
import { socket } from "@/lib/socket-client";
dayjs.locale('es');
dayjs.extend(relativeTime);

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

function flattenExamenes(examenes) {
    let flat = [];
    for (const ex of examenes) {
        if (ex.sub) {
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
}

export default function Ficha({ pacienteId }) {
    const [tab, setTab] = useState("personal");
    const [ficha, setFicha] = useState(null);
    const [paciente, setPaciente] = useState({
        nombres: "", apellidos: "", rut: "", fechaNacimiento: null, correoElectronico: ""
    });
    const [profesional, setProfesional] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [fichaCompleta, setFichaCompleta] = useState(false); // Flag para controlar carga inicial
    
    // Flag específico para permitir guardado automático (solo después de carga completa)
    const [permitirGuardadoAutomatico, setPermitirGuardadoAutomatico] = useState(false);
    
    // Ref para bloquear completamente las llamadas durante carga inicial
    const bloqueandoCarga = useRef(true);

    // Campos editables
    const [anamnesis, setAnamnesis] = useState("");
    const [indicaciones, setIndicaciones] = useState("");
    const [solicitudExamenes, setSolicitudExamenes] = useState([]);
    const [examenInput, setExamenInput] = useState("");
    const [examenAutocomplete, setExamenAutocomplete] = useState([]);
    const [recetaInput, setRecetaInput] = useState("");
    const [recetaAutocomplete, setRecetaAutocomplete] = useState([]);
    const [medicamentosReceta, setMedicamentosReceta] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [loadingFichaInicial, setLoadingFichaInicial] = useState(true); // Para la carga inicial completa
    
    // Estados para antecedentes mórbidos y medicamentos desde API
    const [antecedentesMorbidos, setAntecedentesMorbidos] = useState([]);
    const [medicamentos, setMedicamentos] = useState([]);
    const [examenes, setExamenes] = useState([]);
    const [examenesFlatted, setExamenesFlatted] = useState([]);
    
    const [otroMorbido, setOtroMorbido] = useState("");
    const [medicamentoInput, setMedicamentoInput] = useState("");
    const [medicamentoAutocomplete, setMedicamentoAutocomplete] = useState([]);
    const [medicamentosDisponibles, setMedicamentosDisponibles] = useState([]);
    const [operaciones, setOperaciones] = useState([]);
    const [metodosAnticonceptivos, setMetodosAnticonceptivos] = useState([{
        glosa: "Anticonceptivos orales", checked: false
    }, {
        glosa: "Dispositivo intrauterino (DIU)", checked: false
    }]);
    const [otroAnticonceptivo, setOtroAnticonceptivo] = useState("");
    const [partos, setPartos] = useState([]);
    const [habitoAlimenticioLocal, setHabitoAlimenticioLocal] = useState("");
    const [aguaCm3DiaLocal, setAguaCm3DiaLocal] = useState(0);
    const [ejercicioHrsSemanaLocal, setEjercicioHrsSemanaLocal] = useState(0);
    const [cigarrillosPorDiaLocal, setCigarrillosPorDiaLocal] = useState(0);
    const [higiene, setHigiene] = useState({
        fuma: false,
        agua: 0,
        ejercicioSemanal: 0,
        nivelStress: 0,
        calidadDormir: 0,
        habitoAlimenticio: ""
    });
    
    const [modalHistorico, setModalHistorico] = useState(false);
    const [modalAlergias, setModalAlergias] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [modalConfirmacion, setModalConfirmacion] = useState(false);
    const router = useRouter();

    // Función para verificar si las alergias están vacías
    const estaAlergiaVacia = () => {
        const alergias = paciente?.alergias;
        return !alergias || alergias.length === 0 || alergias.every(alergia => !alergia.trim());
    };

    // Función para determinar qué tabs mostrar según especialidad
    const getTabsSegunEspecialidad = () => {
        if (!profesional || !profesional.especialidadIds || profesional.especialidadIds.length === 0) {
            return TABS_OTROS; // Default para usuarios sin especialidad
        }
        
        // Verificar si alguna especialidad es "Medico"
        const esMedico = profesional.especialidadIds.some(esp => 
            esp.nombre && esp.nombre.toLowerCase() === 'medico'
        );
        
        return esMedico ? TABS_MEDICO : TABS_OTROS;
    };

    // Función para verificar si es médico (NO debe mostrar secciones médicas en info personal)
    const esMedico = () => {
        if (!profesional || !profesional.especialidadIds || profesional.especialidadIds.length === 0) {
            return false;
        }
        
        return profesional.especialidadIds.some(esp => 
            esp.nombre && esp.nombre.toLowerCase() === 'medico'
        );
    };

    // Fetch ficha
    useEffect(() => {
        if (!pacienteId) return;
        
        // Resetear flags al cambiar de paciente
        setFichaCompleta(false);
        setLoadingFichaInicial(true); // Iniciar carga inicial
        setPermitirGuardadoAutomatico(false); // Bloquear guardado automático durante carga
        bloqueandoCarga.current = true; // BLOQUEO TOTAL durante carga
        
        console.log("🔴 CARGA INICIAL - Bloqueo total activado");
        
        const cargarDatos = async () => {
            try {
                // Cargar datos de ficha/paciente
                const fichaRes = await fetch(`/api/paciente/ficha?pacienteId=${pacienteId}`);
                const fichaData = await fichaRes.json();
                
                console.log("Ficha data:", fichaData);
                setFicha(fichaData.ficha);
                setPaciente(fichaData.paciente);
                setProfesional(fichaData.profesional);
                setHistorico(fichaData.historico || []);
                setAnamnesis(fichaData.ficha?.anamnesis || "");
                setIndicaciones(fichaData.ficha?.indicaciones || "");
                
                // Cargar datos de higiene del paciente si existen
                if (fichaData.paciente?.higiene) {
                    setHigiene({
                        fuma: fichaData.paciente.higiene.fuma || false,
                        agua: fichaData.paciente.higiene.agua || 0,
                        ejercicioSemanal: fichaData.paciente.higiene.ejercicioSemanal || 0,
                        nivelStress: fichaData.paciente.higiene.nivelStress || 0,
                        calidadDormir: fichaData.paciente.higiene.calidadDormir || 0,
                        habitoAlimenticio: fichaData.paciente.higiene.habitoAlimenticio || ""
                    });
                    
                    // Inicializar estados locales para campos que usan onBlur
                    setHabitoAlimenticioLocal(fichaData.paciente.higiene.habitoAlimenticio || "");
                    setAguaCm3DiaLocal(fichaData.paciente.higiene.aguaCm3Dia || 0);
                    setEjercicioHrsSemanaLocal(fichaData.paciente.higiene.ejercicioHrsSemana || 0);
                    setCigarrillosPorDiaLocal(fichaData.paciente.higiene.cigarrillosPorDia || 0);
                }
                
                // Cargar lista de antecedentes mórbidos disponibles
                const antecedentesRes = await fetch('/api/antecedentesMorbidos');
                const antecedentesData = await antecedentesRes.json();
                console.log("ANTECEDENTES DATA", antecedentesData);
                
                if (antecedentesData.antecedentes) {
                    // Debug: verificar estructura de datos del paciente
                    console.log("Antecedentes del paciente:", fichaData.paciente?.antecedenteMorbidoIds);
                    console.log("Antecedentes disponibles:", antecedentesData.antecedentes);

                    // Combinar los antecedentes disponibles con los seleccionados del paciente
                    const antecedentesConEstado = antecedentesData.antecedentes.map(antecedente => ({
                        glosa: antecedente.nombre,
                        checked: false // Por defecto no están seleccionados
                    }));
                    
                    // Marcar como seleccionados los antecedentes del paciente
                    if (fichaData.paciente?.antecedenteMorbidoIds && Array.isArray(fichaData.paciente.antecedenteMorbidoIds)) {
                        fichaData.paciente.antecedenteMorbidoIds.forEach(antecedentesPaciente => {
                            // Verificar si es un objeto con glosa, nombre, o solo un string
                            let nombreAntecedente;
                            let estaCheckeado = true;
                            
                            if (typeof antecedentesPaciente === 'string') {
                                nombreAntecedente = antecedentesPaciente;
                            } else if (antecedentesPaciente && typeof antecedentesPaciente === 'object') {
                                nombreAntecedente = antecedentesPaciente.glosa || antecedentesPaciente.nombre || antecedentesPaciente.toString();
                                estaCheckeado = antecedentesPaciente.checked !== undefined ? antecedentesPaciente.checked : true;
                            } else {
                                nombreAntecedente = antecedentesPaciente?.toString() || '';
                            }
                            
                            console.log("Procesando antecedente del paciente:", nombreAntecedente, "checked:", estaCheckeado);
                            
                            // Buscar en la lista y marcar como seleccionado
                            const index = antecedentesConEstado.findIndex(a => 
                                a.glosa && nombreAntecedente && 
                                a.glosa.toLowerCase().trim() === nombreAntecedente.toLowerCase().trim()
                            );
                            
                            if (index >= 0) {
                                antecedentesConEstado[index].checked = estaCheckeado;
                                console.log("Marcado como checked:", antecedentesConEstado[index]);
                            } else {
                                // Si no existe en la lista general, agregarlo
                                antecedentesConEstado.push({
                                    glosa: nombreAntecedente,
                                    checked: estaCheckeado
                                });
                                console.log("Agregado nuevo antecedente:", nombreAntecedente);
                            }
                        });
                    }
                    
                    console.log("Estado final de antecedentes:", antecedentesConEstado);
                    setAntecedentesMorbidos(antecedentesConEstado);
                }
                
                // Cargar lista de medicamentos disponibles
                const medicamentosRes = await fetch('/api/medicamentos');
                const medicamentosData = await medicamentosRes.json();
                
                if (medicamentosData.medicamentos) {
                    // Los medicamentos del paciente necesitan tener unidades y frecuencia inicializados
                    if (fichaData.paciente?.medicamentoIds) {
                        const medicamentosConDefaults = fichaData.paciente.medicamentoIds.map(med => ({
                            ...med,
                            unidades: med.unidades || 1,
                            frecuencia: med.frecuencia || 8
                        }));
                        setMedicamentos(medicamentosConDefaults);
                    }
                    
                    // Guardamos la lista completa para autocompletado
                    setMedicamentosDisponibles(medicamentosData.medicamentos);
                    
                    // También usamos los mismos medicamentos para las recetas
                    setMedicamentosReceta(medicamentosData.medicamentos);
                }

                // Cargar lista de exámenes disponibles
                const examenesRes = await fetch('/api/examenes');
                const examenesData = await examenesRes.json();
                
                if (examenesData.examenes) {
                    setExamenes(examenesData.examenes);
                    // Aplanar la estructura de exámenes para facilitar búsqueda
                    const examenesFlat = flattenExamenes(examenesData.examenes);
                    setExamenesFlatted(examenesFlat);
                }
                
                // Verificar si las alergias están vacías y mostrar alerta
                const alergias = fichaData.paciente?.alergias;
                const tieneAlergias = alergias && alergias.length > 0 && alergias.some(alergia => alergia.trim() !== '');
                if (!tieneAlergias) {
                    // Mostrar modal después de un pequeño delay para que se cargue la interfaz
                    setTimeout(() => {
                        setModalAlergias(true);
                    }, 500);
                }
                
            } catch (error) {
                console.error('Error cargando datos:', error);
            } finally {
                // Marcar que la ficha está completamente cargada
                setTimeout(() => {
                    setFichaCompleta(true);
                    setLoadingFichaInicial(false); // Terminar carga inicial
                    
                    // IMPORTANTE: Desbloquear guardado automático solo después de un delay adicional
                    // para asegurar que todos los states se hayan establecido
                    setTimeout(() => {
                        bloqueandoCarga.current = false; // DESBLOQUEO TOTAL
                        setPermitirGuardadoAutomatico(true);
                        console.log("🟢 BLOQUEO DESACTIVADO - Guardado automático habilitado");
                    }, 500); // Delay más largo para asegurar que todo esté listo
                }, 100);
            }
        };
        
        cargarDatos();
    }, [pacienteId]);

    // Helper para verificar si se puede guardar automáticamente
    const puedeGuardarAutomaticamente = () => {
        if (bloqueandoCarga.current) {
            console.log("❌ GUARDADO BLOQUEADO - Carga inicial en progreso");
            return false;
        }
        return fichaCompleta && permitirGuardadoAutomatico;
    };

    // Guardar atributo
    const guardarAtributo = async (atributo, valor) => {
        setGuardando(true);
        const resp = await fetch("/api/profesional/actualizarFicha", {
            method: "POST",
            body: JSON.stringify({
                atributo,
                valor,
                pacienteId
            })
        });
        const data = await resp.json();
        if (data.ok) {
            setGuardando(false);
            console.log(`Atributo ${atributo} guardado`);
        } else {
            console.error("Error guardando atributo:", data.error);
        }
        setGuardando(false);
    };

    // Autocompletar exámenes
    useEffect(() => {
        if (!examenInput) {
            setExamenAutocomplete([]);
            return;
        }
        const q = examenInput.toLowerCase();
        setExamenAutocomplete(examenesFlatted.filter((e) =>
            e.codigo.toLowerCase().includes(q) ||
            e.nombre.toLowerCase().includes(q)
        ).slice(0, 6));
    }, [examenInput, examenesFlatted]);

    // Autocompletar fármacos
    useEffect(() => {
        if (!recetaInput) {
            setRecetaAutocomplete([]);
            return;
        }
        const q = recetaInput.toLowerCase();
        setRecetaAutocomplete(
            medicamentosReceta.filter(
                (f) =>
                    (f.codigo && f.codigo.toLowerCase().includes(q)) ||
                    f.nombre.toLowerCase().includes(q)
            ).slice(0, 6)
        );
    }, [recetaInput, medicamentosReceta]);









    // Autocompletar medicamentos
    useEffect(() => {
        if (!medicamentoInput) {
            setMedicamentoAutocomplete([]);
            return;
        }
        
        // Filtrar medicamentos por coincidencia en nombre
        const q = medicamentoInput.toLowerCase();
        const medicamentosFiltrados = medicamentosDisponibles.filter(med =>
            med.nombre.toLowerCase().includes(q)
        ).slice(0, 6);
        
        setMedicamentoAutocomplete(medicamentosFiltrados);
    }, [medicamentoInput, medicamentosDisponibles]);

    // Cambiar a primer tab disponible si el actual no está permitido
    useEffect(() => {
        if (profesional) {
            const tabsPermitidos = getTabsSegunEspecialidad();
            const tabActualPermitido = tabsPermitidos.some(t => t.key === tab);
            
            if (!tabActualPermitido) {
                setTab(tabsPermitidos[0].key);
                console.log(`Tab '${tab}' no permitido para especialidad, cambiando a '${tabsPermitidos[0].key}'`);
            }
        }
    }, [profesional, tab]);

    // Handlers
    const handleAnamnesisChange = (e) => {
        setAnamnesis(e.target.value);
    };
    const handleAnamnesisBlur = () => {
        guardarAtributo("anamnesis", anamnesis);
    };

    const handleIndicacionesChange = (e) => {
        setIndicaciones(e.target.value);
    };
    const handleIndicacionesBlur = () => {
        guardarAtributo("indicaciones", indicaciones);
    };

    const handleExamenInput = (e) => setExamenInput(e.target.value);
    const handleExamenSelect = (ex) => {
        setExamenInput(ex.codigo);
        setExamenAutocomplete([]);
    };
    const handleAgregarExamen = () => {
        const ex = examenesFlatted.find((e) => e.codigo === examenInput);
        if (ex && !solicitudExamenes.some((s) => s.codigo === ex.codigo)) {
            const nuevos = [...solicitudExamenes, ex];
            setSolicitudExamenes(nuevos);
            guardarAtributo("solicitudExamenes", nuevos.map((e) => e.codigo));
        }
        setExamenInput("");
        setExamenAutocomplete([]);
    };
    const handleEliminarExamen = (codigo) => {
        const nuevos = solicitudExamenes.filter((e) => e.codigo !== codigo);
        setSolicitudExamenes(nuevos);
        guardarAtributo("solicitudExamenes", nuevos.map((e) => e.codigo));
    };

    const handleRecetaInput = (e) => setRecetaInput(e.target.value);
    const handleRecetaSelect = (f) => {
        setRecetaInput(f.nombre);
        setRecetaAutocomplete([]);
    };
    const handleAgregarReceta = () => {
        if (recetaInput.trim()) {
            const nueva = {
                fecha: new Date(),
                texto: recetaInput.trim(),
            };
            const nuevas = [...recetas, nueva];
            setRecetas(nuevas);
            guardarAtributo("recetas", nuevas);
            setRecetaInput("");
            setRecetaAutocomplete([]);
        }
    };

    const fetchHistorico = async () => {
        setLoadingHistorico(true);  
        if (!pacienteId) return;
        const resp = await fetch(`/api/paciente/historico?pacienteId=${paciente._id}`);
        if(resp.ok) {
            const data = await resp.json();
            console.log("Histórico completo cargado:", data);
            setHistorico(data.historico);
            setModalHistorico(true);    
        } else {
            toast.error("Error al cargar el histórico de fichas.");
        }
        setLoadingHistorico(false);
    };



    const handleTerminarAtencion = async () => {
        setFinishing(true);
        const response = await fetch('/api/profesional/terminarAtencion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            toast.success(data.message || "Atención terminada correctamente");
            socket.emit('update-centrointegral', { pacienteId: pacienteId });
            // Redirigir o cerrar la ficha después de un breve delay
            setTimeout(() => {
                router.back(); // o la ruta que corresponda
            }, 2000);
        } else {
            const errorData = await response.json();
            toast.error(errorData.error || "Error al terminar la atención");
        }
    }

    // Funciones de guardado manual (para reemplazar useEffect automáticos)
    const guardarAntecedentesManuales = () => {
        if (puedeGuardarAutomaticamente() && antecedentesMorbidos.length > 0) {
            const seleccionados = antecedentesMorbidos
                .filter(item => item.checked)
                .map(item => ({ glosa: item.glosa, checked: true }));
            console.log("💾 Guardando antecedentes mórbidos MANUALMENTE");
            guardarAtributo("antecedenteMorbidoIds", seleccionados);
        }
    };

    const guardarMedicamentosManuales = () => {
        if (puedeGuardarAutomaticamente() && medicamentos.length > 0) {
            console.log("💾 Guardando medicamentos MANUALMENTE");
            guardarAtributo("medicamentoIds", medicamentos);
        }
    };

    const guardarHigieneManuales = () => {
        if (puedeGuardarAutomaticamente() && Object.values(higiene).some(value => value !== "" && value !== 0 && value !== false)) {
            console.log("💾 Guardando higiene MANUALMENTE");
            guardarAtributo("higiene", higiene);
        }
    };

    const guardarPartosManuales = () => {
        if (puedeGuardarAutomaticamente() && partos.length > 0) {
            console.log("💾 Guardando partos MANUALMENTE");
            guardarAtributo("partos", partos);
        }
    };

    return (
        <div className="relative p-2 bg-gradient-to-br from-[#A78D60] via-[#EFC974] to-[#A48A60] h-screen">
            {/* Guardando... */}
            {guardando && (
                <div className="absolute top-2 right-4 bg-[#66754c] text-white px-3 py-1 rounded shadow animate-pulse z-20">
                    Guardando...
                </div>
            )}

            {/* Modal Loader Ficha Inicial */}
            {loadingFichaInicial && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A78D60] mb-4"></div>
                        <div className="text-[#68563c] font-medium text-lg">Cargando ficha...</div>
                    </div>
                </div>
            )}

            {/* Encabezado paciente */}
            <div className="mb-4">
                <div className="bg-[#f6eedb] rounded-lg p-4 shadow border border-[#d5c7aa]">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-[#ac9164] flex items-center justify-center text-2xl font-bold text-white">
                            {paciente
                                ? paciente.nombres?.[0]?.toUpperCase() +
                                (paciente.apellidos?.[0]?.toUpperCase() || "")
                                : ""}
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-lg text-[#68563c]">
                                {paciente
                                    ? `${paciente.nombres} ${paciente.apellidos || ""}`
                                    : "Cargando..."}
                            </div>
                            <div className="text-sm text-[#66754c]">
                                {paciente?.rut}
                                {paciente?.fechaNacimiento
                                    ? ` • ${new Date(
                                        paciente.fechaNacimiento
                                    ).toLocaleDateString()}`
                                    : ""}
                            </div>
                            <div className="text-xs text-[#8e9b6d]">
                                {paciente?.correoElectronico}
                            </div>
                        </div>
                        <div className="text-xs text-[#8e9b6d]">
                            Profesional:{" "}
                            <p className="font-semibold text-[#6a3858] text-md">
                                {profesional?.userId?.name || "No asignado"}
                            </p>
                        </div>
                    </div>

                    {/* Histórico */}
                    <button
                        className="mt-3 pt-3 border-t border-[#d5c7aa] w-full text-left"
                        onClick={async () => {
                            fetchHistorico();
                        }}
                    >
                        <div className="text-xs text-[#8e9b6d] hover:text-[#68563c] transition-colors cursor-pointer">
                            📋 Ver histórico de fichas
                        </div>
                    </button>
                </div>
            </div>

            {/* Contenido principal con efecto carpeta */}
            <div className="flex h-[calc(100vh-166px)] relative">
                {/* Contenido (izquierda) - Conectado con tab activo */}
                <div className="flex-1 bg-[#f6eedb] shadow border border-r-0 border-[#d5c7aa] overflow-y-auto relative z-10"
                    style={{
                        borderTopLeftRadius: '0.75rem',
                        borderBottomLeftRadius: '0.75rem'
                    }}>
                    <div className="p-6">
                        {tab === "personal" && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-[#6a3858] mb-4">Información Personal</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                            Nombres
                                        </label>
                                        <input
                                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            defaultValue={paciente?.nombres || ""}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                            Apellidos
                                        </label>
                                        <input
                                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            defaultValue={paciente?.apellidos || ""}
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <div className="w-full">
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                            RUT
                                        </label>
                                        <input
                                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            defaultValue={paciente?.rut || ""}
                                        />
                                    </div>

                                    <div className="w-1/3">
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                            Genero
                                        </label>
                                        <select
                                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            value={paciente?.genero || ""}
                                            onChange={(e) => {
                                                setPaciente(prev => ({ ...prev, genero: e.target.value }));
                                                guardarAtributo("genero", e.target.value);
                                            }}
                                        >
                                            <option value="">Seleccione</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                            <option value="O">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="w-full">
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                        defaultValue={paciente?.direccion || ""}
                                        onBlur={(e) => guardarAtributo("direccion", e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                            Teléfono
                                        </label>
                                        <input
                                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            defaultValue={paciente?.telefono || ""}
                                            onBlur={(e) => guardarAtributo("telefono", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                            Sistema de Salud
                                        </label>
                                        <select
                                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            value={paciente?.sistemaSalud || ""}
                                            onChange={(e) => {
                                                setPaciente(prev => ({ ...prev, sistemaSalud: e.target.value }));
                                                guardarAtributo("sistemaSalud", e.target.value);
                                            }}
                                        >
                                            <option value="">Seleccione</option>
                                            <option value="FON">Fonasa</option>
                                            <option value="ISA">Isapre</option>
                                            <option value="PAR">Particular</option>
                                            <option value="FAR">Fuerzas armadas</option>
                                            <option value="OTR">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                        Email
                                    </label>
                                    <input
                                        className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                        defaultValue={paciente?.email || ""}
                                        onBlur={(e) => guardarAtributo("email", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                        Alergias
                                    </label>
                                    <textarea
                                        className={`w-full border rounded px-3 py-2 bg-white h-20 focus:ring-2 focus:ring-[#fad379]/20 ${
                                            estaAlergiaVacia() 
                                                ? 'border-red-500 focus:border-red-600' 
                                                : 'border-[#d5c7aa] focus:border-[#ac9164]'
                                        }`}
                                        defaultValue={paciente?.alergias?.join(", ") || ""}
                                        onChange={(e) => {
                                            // Actualizar el paciente inmediatamente para que cambie el color del borde
                                            const nuevasAlergias = e.target.value.split(",").map(item => item.trim());
                                            setPaciente(prev => ({ ...prev, alergias: nuevasAlergias }));
                                        }}
                                        onBlur={(e) => {
                                            guardarAtributo("alergias", e.target.value.split(",").map(item => item.trim()));
                                        }}
                                    />
                                </div>

                                {/* Antecedentes Mórbidos - Solo para NO médicos */}
                                {!esMedico() && (
                                <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
                                    <h3 className="text-lg font-bold text-[#6a3858] mb-3">Antecedentes Mórbidos</h3>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {antecedentesMorbidos.map((item, index) => (
                                            <label key={index} className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.checked}
                                                    onChange={(e) => {
                                                        const nuevos = [...antecedentesMorbidos];
                                                        nuevos[index].checked = e.target.checked;
                                                        setAntecedentesMorbidos(nuevos);
                                                        // Guardado manual después de cambio
                                                        setTimeout(() => guardarAntecedentesManuales(), 100);
                                                    }}
                                                    className="text-[#ac9164]"
                                                />
                                                <span className="text-sm text-[#68563c]">{item.glosa}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Otro antecedente mórbido..."
                                            className="flex-1 border border-[#d5c7aa] rounded px-3 py-2 bg-white text-sm focus:border-[#ac9164]"
                                            value={otroMorbido}
                                            onChange={(e) => setOtroMorbido(e.target.value)}
                                        />
                                        <button 
                                            onClick={() => {
                                                if (otroMorbido.trim()) {
                                                    setAntecedentesMorbidos([...antecedentesMorbidos, { glosa: otroMorbido.trim(), checked: true }]);
                                                    setOtroMorbido("");
                                                    // Guardado manual después de agregar
                                                    setTimeout(() => guardarAntecedentesManuales(), 100);
                                                }
                                            }}
                                            className="bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                                )}

                                {!esMedico() && (
                                <div className="space-y-6">
                                        {/* Medicamentos */}
                                        <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
                                            <details className="group">
                                                <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                                                    <span className="group-open:rotate-90 transition-transform">
                                                        <FaCaretSquareRight size="1.2rem"/>
                                                    </span>
                                                    Medicamentos
                                                </summary>
                                                <div className="mt-4 space-y-4">
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 relative">
                                                            <input
                                                                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164]"
                                                                value={medicamentoInput}
                                                                onChange={(e) => setMedicamentoInput(e.target.value)}
                                                                placeholder="Nombre del medicamento"
                                                            />
                                                            {medicamentoAutocomplete.length > 0 && (
                                                                <div className="absolute top-full left-0 right-0 bg-white border border-[#d5c7aa] rounded shadow z-10 mt-1">
                                                                    {medicamentoAutocomplete.map((med) => (
                                                                        <div
                                                                            key={med._id || med.codigo}
                                                                            className="px-3 py-2 hover:bg-[#fad379]/20 cursor-pointer"
                                                                            onClick={() => {
                                                                                setMedicamentoInput(med.nombre);
                                                                                setMedicamentoAutocomplete([]);
                                                                            }}
                                                                        >
                                                                            {med.nombre}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            className="bg-[#66754c] text-white px-4 py-2 rounded hover:bg-[#8e9b6d]"
                                                            onClick={() => {
                                                                if (medicamentoInput.trim()) {
                                                                    setMedicamentos([...medicamentos, {
                                                                        nombre: medicamentoInput.trim(),
                                                                        unidades: 1,
                                                                        frecuencia: 8
                                                                    }]);
                                                                    setMedicamentoInput("");
                                                                    // Guardado manual después de agregar
                                                                    setTimeout(() => guardarMedicamentosManuales(), 100);
                                                                }
                                                            }}
                                                        >
                                                            Agregar
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {medicamentos.map((med, index) => (
                                                            <div key={index} className="bg-[#fad379]/20 border border-[#fad379] rounded p-3">
                                                                <div className="font-medium text-[#68563c] mb-2">{med.nombre}</div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-xs text-[#8e9b6d]">Unidades por dosis</label>
                                                                        <input 
                                                                            type="number" 
                                                                            min="1"
                                                                            value={med.unidades}
                                                                            onChange={(e) => {
                                                                                const nuevos = [...medicamentos];
                                                                                nuevos[index].unidades = parseInt(e.target.value) || 1;
                                                                                setMedicamentos(nuevos);
                                                                                // Guardado manual después de cambio
                                                                                setTimeout(() => guardarMedicamentosManuales(), 300);
                                                                            }}
                                                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-[#8e9b6d]">Cada (horas)</label>
                                                                        <input 
                                                                            type="number" 
                                                                            min="1"
                                                                            value={med.frecuencia}
                                                                            onChange={(e) => {
                                                                                const nuevos = [...medicamentos];
                                                                                nuevos[index].frecuencia = parseInt(e.target.value) || 8;
                                                                                setMedicamentos(nuevos);
                                                                                // Guardado manual después de cambio
                                                                                setTimeout(() => guardarMedicamentosManuales(), 300);
                                                                            }}
                                                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
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
                                                        value={operaciones}
                                                        onChange={(e) => setOperaciones(e.target.value)}
                                                        onBlur={(e) => guardarAtributo("operaciones", e.target.value)}
                                                        placeholder="Detalle de operaciones quirúrgicas..."
                                                    />
                                                </div>
                                            </details>
                                        </div>

                                        {/* Métodos Anticonceptivos - Solo para mujeres */}
                                        {paciente?.genero === 'F' && (
                                            <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
                                                <details className="group">
                                                    <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                                                        <span className="group-open:rotate-90 transition-transform">
                                                            <FaCaretSquareRight size="1.2rem"/>
                                                        </span>
                                                        Métodos Anticonceptivos
                                                    </summary>
                                                    <div className="mt-4 space-y-4">
                                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                                            {metodosAnticonceptivos.map((item, index) => (
                                                                <label key={index} className="flex items-center gap-2">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={item.checked}
                                                                        onChange={(e) => {
                                                                            const nuevos = [...metodosAnticonceptivos];
                                                                            nuevos[index].checked = e.target.checked;
                                                                            setMetodosAnticonceptivos(nuevos);
                                                                        }}
                                                                        className="text-[#ac9164]"
                                                                    />
                                                                    <span className="text-sm text-[#68563c]">{item.glosa}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Otro método anticonceptivo..."
                                                                className="flex-1 border border-[#d5c7aa] rounded px-3 py-2 bg-white text-sm focus:border-[#ac9164]"
                                                                value={otroAnticonceptivo}
                                                                onChange={(e) => setOtroAnticonceptivo(e.target.value)}
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    if (otroAnticonceptivo.trim()) {
                                                                        setMetodosAnticonceptivos([...metodosAnticonceptivos, { glosa: otroAnticonceptivo.trim(), checked: true }]);
                                                                        setOtroAnticonceptivo("");
                                                                    }
                                                                }}
                                                                className="bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]"
                                                            >
                                                                Agregar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </details>
                                            </div>
                                        )}

                                        {/* Partos - Solo para mujeres */}
                                        {paciente?.genero === 'F' && (
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
                                                            onClick={() => setPartos([...partos, { numero: partos.length + 1, genero: "", aborto: false }])}
                                                            className="mb-4 bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]"
                                                        >
                                                            Agregar Parto
                                                        </button>
                                                        <table className="w-full border-collapse">
                                                            <thead>
                                                                <tr className="bg-[#d5c7aa]">
                                                                    <th className="border border-[#ac9164] p-2 text-left text-sm">Número</th>
                                                                    <th className="border border-[#ac9164] p-2 text-left text-sm">Género</th>
                                                                    <th className="border border-[#ac9164] p-2 text-left text-sm">Aborto</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {partos.map((parto, index) => (
                                                                    <tr key={index}>
                                                                        <td className="border border-[#d5c7aa] p-2 text-sm">{parto.numero}</td>
                                                                        <td className="border border-[#d5c7aa] p-2">
                                                                            <select 
                                                                                value={parto.genero}
                                                                                onChange={(e) => {
                                                                                    const nuevos = [...partos];
                                                                                    nuevos[index].genero = e.target.value;
                                                                                    setPartos(nuevos);
                                                                                }}
                                                                                className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                                                            >
                                                                                <option value="">Seleccionar</option>
                                                                                <option value="niño">Niño</option>
                                                                                <option value="niña">Niña</option>
                                                                                <option value="no sabe">No sabe</option>
                                                                            </select>
                                                                        </td>
                                                                        <td className="border border-[#d5c7aa] p-2">
                                                                            <input 
                                                                                type="checkbox" 
                                                                                checked={parto.aborto}
                                                                                onChange={(e) => {
                                                                                    const nuevos = [...partos];
                                                                                    nuevos[index].aborto = e.target.checked;
                                                                                    setPartos(nuevos);
                                                                                }}
                                                                                className="text-[#ac9164]"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </details>
                                            </div>
                                        )}

                                        {/* Higiene */}
                                        <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
                                            <details className="group">
                                                <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                                                    <span className="group-open:rotate-90 transition-transform">
                                                        <FaCaretSquareRight size="1.2rem"/>
                                                    </span>
                                                    Higiene
                                                </summary>
                                                <div className="mt-4 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={higiene.fuma}
                                                                onChange={(e) => {
                                                                    setHigiene({...higiene, fuma: e.target.checked});
                                                                    // Guardado manual después de cambio
                                                                    setTimeout(() => guardarHigieneManuales(), 100);
                                                                }}
                                                                className="text-[#ac9164]"
                                                            />
                                                            <label className="text-sm text-[#68563c]">Fuma</label>
                                                            {higiene.fuma && (
                                                                <div className="flex items-center gap-1">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0"
                                                                        value={cigarrillosPorDiaLocal}
                                                                        onChange={(e) => setCigarrillosPorDiaLocal(parseInt(e.target.value) || 0)}
                                                                        onBlur={(e) => guardarAtributo("cigarrillosPorDia", parseInt(e.target.value) || 0)}
                                                                        className="w-16 border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                                                    />
                                                                    <span className="text-xs text-[#8e9b6d]">por día</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-[#68563c]">Agua (cm³/día)</label>
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                value={aguaCm3DiaLocal}
                                                                onChange={(e) => setAguaCm3DiaLocal(parseInt(e.target.value) || 0)}
                                                                onBlur={(e) => guardarAtributo("aguaCm3Dia", parseInt(e.target.value) || 0)}
                                                                className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-[#68563c]">Ejercicio (hrs/semana)</label>
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                step="0.5"
                                                                value={ejercicioHrsSemanaLocal}
                                                                onChange={(e) => setEjercicioHrsSemanaLocal(parseFloat(e.target.value) || 0)}
                                                                onBlur={(e) => guardarAtributo("ejercicioHrsSemana", parseFloat(e.target.value) || 0)}
                                                                className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-[#68563c] mb-2 block">Nivel de estrés</label>
                                                            <div className="flex gap-2 justify-center">
                                                                {['Bajo', 'Medio', 'Alto'].map((nivel, index) => {
                                                                    const emojis = ['😊', '😐', '😰'];
                                                                    const colors = [
                                                                        'bg-green-50 border-green-300 text-green-700 hover:bg-green-100', 
                                                                        'bg-[#fad379]/20 border-[#fad379] text-[#68563c] hover:bg-[#fad379]/30', 
                                                                        'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                                                    ];
                                                                    const selectedColors = [
                                                                        'bg-green-100 border-green-400 text-green-800 ring-2 ring-green-300', 
                                                                        'bg-[#fad379]/40 border-[#ac9164] text-[#68563c] ring-2 ring-[#ac9164]', 
                                                                        'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-300'
                                                                    ];
                                                                    const isSelected = higiene.nivelStress === index;
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={nivel}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setHigiene({...higiene, nivelStress: index});
                                                                                // Guardado manual después de cambio
                                                                                setTimeout(() => guardarHigieneManuales(), 100);
                                                                            }}
                                                                            className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                                                                                isSelected ? selectedColors[index] : colors[index]
                                                                            }`}
                                                                        >
                                                                            <div className="text-2xl mb-1">{emojis[index]}</div>
                                                                            <div className="text-xs font-medium">{nivel}</div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-[#68563c] mb-2 block">Nivel de sueño</label>
                                                            <div className="flex gap-2 justify-center">
                                                                {['Bueno', 'Regular', 'Malo'].map((nivel, index) => {
                                                                    const emojis = ['😴', '😪', '😵'];
                                                                    const colors = [
                                                                        'bg-green-50 border-green-300 text-green-700 hover:bg-green-100', 
                                                                        'bg-[#fad379]/20 border-[#fad379] text-[#68563c] hover:bg-[#fad379]/30', 
                                                                        'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                                                    ];
                                                                    const selectedColors = [
                                                                        'bg-green-100 border-green-400 text-green-800 ring-2 ring-green-300', 
                                                                        'bg-[#fad379]/40 border-[#ac9164] text-[#68563c] ring-2 ring-[#ac9164]', 
                                                                        'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-300'
                                                                    ];
                                                                    const isSelected = higiene.calidadDormir === index;
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={nivel}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setHigiene({...higiene, calidadDormir: index});
                                                                                // Guardado manual después de cambio
                                                                                setTimeout(() => guardarHigieneManuales(), 100);
                                                                            }}
                                                                            className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                                                                                isSelected ? selectedColors[index] : colors[index]
                                                                            }`}
                                                                        >
                                                                            <div className="text-2xl mb-1">{emojis[index]}</div>
                                                                            <div className="text-xs font-medium">{nivel}</div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm text-[#68563c]">Hábito alimenticio</label>
                                                        <textarea
                                                            value={habitoAlimenticioLocal}
                                                            onChange={(e) => setHabitoAlimenticioLocal(e.target.value)}
                                                            onBlur={(e) => guardarAtributo("habitoAlimenticio", e.target.value)}
                                                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-20 focus:border-[#ac9164] text-sm"
                                                            placeholder="Describe los hábitos alimenticios del paciente..."
                                                        />
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "anamnesis" && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-[#6a3858] mb-4">Anamnesis / Exámen Físico</h2>                                
                                <div>
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                        Descripción clínica
                                    </label>
                                    <textarea
                                        className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-32 focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                        value={anamnesis}
                                        onChange={handleAnamnesisChange}
                                        onBlur={handleAnamnesisBlur}
                                        placeholder="Describa la anamnesis y hallazgos del examen físico..."
                                    />
                                    </div>                                
                            </div>
                        )}

                        {tab === "examenes" && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-[#6a3858] mb-4">Exámenes</h2>
                                <div>
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                        Solicitud de exámenes
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <div className="flex-1 relative">
                                            <input
                                                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                                value={examenInput}
                                                onChange={handleExamenInput}
                                                placeholder="Código o nombre de examen"
                                            />
                                            {examenAutocomplete.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 bg-white border border-[#d5c7aa] rounded shadow z-10 mt-1">
                                                    {examenAutocomplete.map((ex) => (
                                                        <div
                                                            key={ex.codigo}
                                                            className="px-3 py-2 hover:bg-[#fad379]/20 cursor-pointer"
                                                            onClick={() => handleExamenSelect(ex)}
                                                        >
                                                            <span className="font-mono text-xs text-[#6a3858]">
                                                                {ex.codigo}
                                                            </span>{" "}
                                                            {ex.nombre}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="bg-[#66754c] text-white px-4 py-2 rounded font-semibold hover:bg-[#8e9b6d] transition"
                                            type="button"
                                            onClick={handleAgregarExamen}
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {solicitudExamenes.map((ex) => (
                                            <span
                                                key={ex.codigo}
                                                className="bg-[#fad379]/30 text-[#68563c] px-3 py-1 rounded flex items-center gap-2 border border-[#fad379]"
                                            >
                                                <span className="font-mono text-xs">{ex.codigo}</span>
                                                <span className="text-sm">{ex.nombre}</span>
                                                <button
                                                    className="text-[#6a3858] hover:text-[#68563c] font-bold"
                                                    type="button"
                                                    onClick={() => handleEliminarExamen(ex.codigo)}
                                                    title="Eliminar"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === "indicaciones" && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-[#6a3858] mb-4">Indicaciones</h2>
                                <div>
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                        Indicaciones para el paciente
                                    </label>
                                    <textarea
                                        className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-40 focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                        value={indicaciones}
                                        onChange={handleIndicacionesChange}
                                        onBlur={handleIndicacionesBlur}
                                        placeholder="Indicaciones para el paciente..."
                                    />
                                </div>
                            </div>
                        )}

                        {tab === "receta" && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-[#6a3858] mb-4">Receta</h2>
                                <div>
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">
                                        Agregar medicamento
                                    </label>
                                    <div className="flex gap-2 mb-4">
                                        <div className="flex-1 relative">
                                            <input
                                                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                                value={recetaInput}
                                                onChange={handleRecetaInput}
                                                placeholder="Nombre o código de fármaco"
                                            />
                                            {recetaAutocomplete.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 bg-white border border-[#d5c7aa] rounded shadow z-10 mt-1">
                                                    {recetaAutocomplete.map((f) => (
                                                        <div
                                                            key={f._id || f.codigo}
                                                            className="px-3 py-2 hover:bg-[#fad379]/20 cursor-pointer"
                                                            onClick={() => handleRecetaSelect(f)}
                                                        >
                                                            {f.codigo && (
                                                                <>
                                                                    <span className="font-mono text-xs text-[#6a3858]">
                                                                        {f.codigo}
                                                                    </span>{" "}
                                                                </>
                                                            )}
                                                            {f.nombre}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="bg-[#66754c] text-white px-4 py-2 rounded font-semibold hover:bg-[#8e9b6d] transition"
                                            type="button"
                                            onClick={handleAgregarReceta}
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {recetas.map((r, i) => (
                                            <div
                                                key={i}
                                                className="bg-[#fad379]/20 border border-[#fad379] rounded px-4 py-3 flex items-center gap-3"
                                            >
                                                <span className="text-xs text-[#8e9b6d] font-mono">
                                                    {new Date(r.fecha).toLocaleDateString()}
                                                </span>
                                                <span className="flex-1 font-medium text-[#68563c]">{r.texto}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === "licencias" && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-[#6a3858] mb-4">Licencias Médicas</h2>
                                <div className="flex flex-col gap-4 items-center mt-12">
                                    <button
                                        className="bg-[#ac9164] text-white px-8 py-4 rounded-lg font-bold text-lg shadow hover:bg-[#68563c] transition"
                                        onClick={() =>
                                            window.open("https://wlme.medipass.cl/WebPublic/index.php", "_blank")
                                        }
                                        type="button"
                                    >
                                        📄 Medipas
                                    </button>
                                    <button
                                        className="bg-[#66754c] text-white px-8 py-4 rounded-lg font-bold text-lg shadow hover:bg-[#8e9b6d] transition"
                                        onClick={() =>
                                            window.open("https://www.licencia.cl/sesiones/nueva/rol:profesional", "_blank")
                                        }
                                        type="button"
                                    >
                                        🏥 Aimed
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lengüetas verticales tipo carpeta (derecha) */}
                <div className="relative flex flex-col justify-start bg-transparent h-full -ml-0.5 z-20">
                    {getTabsSegunEspecialidad().map((t, index) => {
                        const isActive = tab === t.key;
                        const isLast = index === getTabsSegunEspecialidad().length - 1;
                        const isFirst = index === 0;
                        return (
                            <button
                                key={t.key}
                                className={`
                                    ${isLast ? 'h-full' : 'h-32'} ${isFirst ? 'mt-0' : '-mt-4'} relative px-4 pt-6 text-md font-semibold
                                    border border-[#d5c7aa] border-l-0
                                    ${isActive
                                        ? "text-[#68563c] bg-[#f6eedb] border-l-0"
                                        : "text-[#8e9b6d] bg-white hover:bg-[#ac9164] hover:text-white border-l-2 border-l-[#d5c7aa] hover:border-l-[#ac9164] hover:border-[#ac9164]"
                                    }
                                    text-left transition-all duration-200
                                `}
                                style={{
                                    minWidth: '200px',
                                    borderTopRightRadius: '0.75rem',
                                    borderBottomRightRadius: isLast ? '0.75rem' : '0',
                                    borderTopLeftRadius: '0',
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

            {/* Componente de histórico de fichas mejorado */}
            <HistoricoFichas 
                isOpen={modalHistorico}
                onClose={() => setModalHistorico(false)}
                historico={historico}
                loading={loadingHistorico}
                pacienteNombre={paciente ? `${paciente.nombres} ${paciente.apellidos || ''}` : ''}
            />



            <div className="fixed bottom-6 right-6 z-50">
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
                    onClick={() => setModalConfirmacion(true)}
                >
                    {/* SVG CiPower logo (placeholder) */}
                    <CiPower className="text-3xl text-[#68563c]" />
                </button>
            </div>
            <ToastContainer />

            {/* Modal de Alerta de Alergias */}
            <Dialog open={modalAlergias} onClose={() => setModalAlergias(false)} className="fixed z-50 inset-0 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/30" onClick={() => setModalAlergias(false)} />
                <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-red-500 max-w-md mx-4 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-red-700">¡Atención!</h3>
                    </div>
                    
                    <div className="mb-6">
                        <h4 className="font-semibold text-red-600 mb-2">Alergias</h4>
                        <p className="text-gray-700">
                            Esta información es importante. Por favor, complete el campo de alergias del paciente.
                        </p>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setModalAlergias(false)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* Modal de Confirmación para Finalizar Sesión */}
            <Dialog open={modalConfirmacion} onClose={() => setModalConfirmacion(false)} className="fixed z-50 inset-0 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/30" onClick={() => setModalConfirmacion(false)} />
                <div className="bg-white rounded-lg p-6 shadow-xl border-2 border-[#ac9164] max-w-md mx-4 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-[#ac9164] rounded-full flex items-center justify-center">
                            <CiPower className="text-white text-lg" />
                        </div>
                        <h3 className="text-lg font-bold text-[#68563c]">Finalizar Sesión</h3>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-gray-700">
                            ¿Seguro desea terminar la sesión?
                        </p>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setModalConfirmacion(false)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                setModalConfirmacion(false);
                                handleTerminarAtencion();
                            }}
                            className="bg-[#ac9164] hover:bg-[#8e7a4f] text-white px-4 py-2 rounded font-medium transition"
                        >
                            Finalizar
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* Overlay de finalización */}
            {finishing &&<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-xl border border-[#d5c7aa]">
                    <Loader texto="Finalizando la atención..." />
                </div>
            </div>}
        </div>
    );
}