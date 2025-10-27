// filepath: d:/git/kskin-manager/app/components/sucursal/Panoramica.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { MdOutlineMeetingRoom } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { BsFillPersonFill } from "react-icons/bs";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import { CiPower } from "react-icons/ci";
import { USER_ROLE } from "@/app/utils/constants";
import { RiDragDropLine, RiUserStarFill } from "react-icons/ri";
import { socket } from "@/lib/socket-client";
import { useOnVisibilityChange } from '@/app/components/uix/useOnVisibilityChange';
import RutInput from '@/app/components/uix/RutInput';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from "next/navigation";
import Loader from "../Loader";
import { LuDoorClosed, LuDoorOpen, LuSearch } from "react-icons/lu";

export default function Panoramica({ session }) {
    const [nuevoPacienteModal, setNuevoPacienteModal] = useState(false);
    const [rutBusqueda, setRutBusqueda] = useState("");
    const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
    const [arribos, setArribos] = useState([]);
    const [boxes, setBoxes] = useState([]);
    const [draggedPaciente, setDraggedPaciente] = useState(null);
    const [modal, setModal] = useState({ open: false, paciente: null, box: null });
    const timers = useRef({});
    const [role, setRole] = useState(session?.user?.role || "??");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [registrandoArribo, setRegistrandoArribo] = useState(false);
    const router = useRouter();

    const registrarArribo = async (paciente) => {
        setRegistrandoArribo(true);
        try {
            const body = !paciente._id
                ? {
                    paciente: {
                        nombres: paciente.nombres.split(" ")[0],
                        apellidos: paciente.nombres.split(" ").slice(1).join(" "),
                        rut: paciente.rut,
                        genero: paciente.genero,
                        nombreSocial: paciente.nombreSocial || ""
                    },
                    fechaLlegada: new Date(),
                    profesionalId: null,
                }
                : {
                    pacienteId: paciente._id,
                    fechaLlegada: new Date(),
                    profesionalId: null,
                };

            const res = await fetch("/api/recepcion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (res.ok) {
                // Actualiza la lista de pacientes en espera
                // Refresca la lista de arribos desde el backend para mantener el formato correcto
                setNuevoPacienteModal(false);
                setPacienteEncontrado(null);
                setRutBusqueda("");
            } else {
                toast.error(data.error || "Error al registrar arribo");
            }
        } catch (err) {
            toast.error("Error de red al registrar arribo");
        } finally {
            setRegistrandoArribo(false);
            socket.emit("update-centrointegral");
            fetchVistaPanoramica();
        }
    };

    // Drag & Drop handlers
    const onDragStart = (paciente) => setDraggedPaciente(paciente);
    const onDragEnd = () => setDraggedPaciente(null);

    const onDropBox = (box) => {
        console.log("DROP", { box, draggedPaciente });
        if (!draggedPaciente || !boxLibre(box)) return;
        setModal({ open: true, paciente: draggedPaciente.pacienteId, box, minutos: 0, horas: 1 });
    };

    // Confirmar asignación
    const confirmarAsignacion = () => {
        const { paciente, box, horas, minutos } = modal;

        console.log("CONFIRMING ASIGNACION", { paciente, box, horas, minutos });

        if (!paciente || !box || (horas + minutos === 0)) {
            toast.error("Faltan datos para asignar box");
            return;
        }

        const tiempoEstimado = ((horas ?? 0) * 60) + (minutos ?? 0);

        const asignacionExitosa = () => {
            if (role === USER_ROLE.profesional) {
                router.push("/modulos/ficha/" + paciente._id);
            } else {
                setModal({ open: false, paciente: null, box: null });
                fetchVistaPanoramica();
                iniciarProgreso(box._id);
            }
        }

        fetch("/api/profesional/asignacion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                boxId: modal.box?._id || box._id,
                pacienteId: modal.paciente?._id || modal.paciente?._id,
                tiempoEstimado,
            }),
        })
            .then(res => res.json())
            .then(data => {
                console.log("RESPONSE /api/profesional/asignacion", data);
                if (!data.ok) {
                    toast.error(data.error || "Error al asignar box");
                } else {
                    asignacionExitosa();
                    toast.success("Box asignado exitosamente");
                    socket.emit("update-centrointegral");
                }
            })
            .catch((err) => {
                toast.error("Error de red al asignar box");
                console.log("ERROR /api/profesional/asignacion", err);
            });

        // Asignar paciente al box

    };

    // Progreso de box ocupado
    const iniciarProgreso = (boxId) => {
        if (timers.current[boxId]) clearInterval(timers.current[boxId]);
        setBoxes((prev) =>
            prev.map((b) =>
                b.id === boxId
                    ? { ...b, progreso: 0 }
                    : b
            )
        );
        let progreso = 0;
        let duracion = boxes.find((b) => b.id === boxId)?.ocupacion.tiempoEstimado;
        console.log("Iniciando progreso box", boxId, "duracion", duracion);
        timers.current[boxId] = setInterval(() => {
            progreso += 1;
            setBoxes((prev) =>
                prev.map((b) =>
                    b.id === boxId
                        ? { ...b, progreso: progreso / duracion }
                        : b
                )
            );
            if (progreso >= duracion) {
                clearInterval(timers.current[boxId]);
                setBoxes((prev) =>
                    prev.map((b) =>
                        b.id === boxId
                            ? { ...b, ocupado: false, paciente: null, progreso: 0 }
                            : b
                    )
                );
            }
        }, 1000);
    };

    const nombreProfesional = (email) => {
        if (!email) return "";
        const nombre = email.split("@")[0];
        return nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }

    const fetchVistaPanoramica = async () => {
        setLoading(true);
        const response = await fetch('/api/panoramica');
        const data = await response.json();
        setArribos(data.arribos || []);
        setBoxes(data.boxes || []);
        console.log("BOXES", data.boxes);
        setLoading(false);
    };

    useEffect(() => {
        socket.on("update-centrointegral", (data) => {
            console.log(">>>> Update centrointegral", data, session);
            fetchVistaPanoramica();
        });

        return () => {
            socket.off("update-centrointegral");
        };
    }, [session, fetchVistaPanoramica]);

    useEffect(() => {
        if (session?.user?.role) setRole(session.user.role);
    }, [session]);

    useEffect(() => {
        setRole(session?.user?.role || -1);
        // Verifica si hay sesión y el socket está conectado
        if (session?.user?.id && socket.connected) {
            console.log("Re-uniendo a room-centrointegral después de posible recarga");
            socket.emit("join-room", {
                room: "room-centrointegral",
                userId: session.user.id
            });
        }

        // Evento para manejar reconexiones del socket
        const handleReconnect = () => {
            if (session?.user?.id) {
                console.log("Socket reconectado, uniendo a sala nuevamente");
                socket.emit("join-room", {
                    room: "room-centrointegral",
                    userId: session.user.id
                });
            }
        };

        // Escucha el evento de reconexión
        socket.on("connect", handleReconnect);

        return () => {
            socket.off("connect", handleReconnect);
        };
    }, [session]);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchVistaPanoramica(),
                ]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // Forzar re-render cada segundo para actualizar contadores
            setBoxes(prev => [...prev]);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useOnVisibilityChange(() => {
        const fetch = async () => {
            setLoading(false);
            fetchVistaPanoramica();
        }
        fetch('/api/panoramica/last-update')
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.updatedAt) {
                    const updatedAt = new Date(data.updatedAt);
                    if (updatedAt > lastUpdate) {
                        setLastUpdate(updatedAt);
                        fetch();
                    }
                }
            })
            .catch(() => { });
    });

    const boxLibre = (box) => {
        // Si no tiene paciente asignado, está libre
        if (!box.pacienteId || !box.profesionalId) return true;

        // Si no tiene inicio de atención, está libre
        if (!box.inicioAtencion) return true;

        // Calcular si el tiempo estimado ya se cumplió
        const inicioTime = new Date(box.inicioAtencion).getTime();
        const tiempoEstimado = box.ocupacion?.tiempoEstimado || 60; // minutos
        const finEstimado = inicioTime + (tiempoEstimado * 60 * 1000); // convertir a milisegundos

        return Date.now() > finEstimado;
    }

    // UI
    return (
        <main className="flex h-screen bg-gradient-to-br from-[#A78D60] via-[#EFC974] to-[#A48A60]">
            {/* Recepción */}
            <section className="w-80 h-full p-4">
                {!loading && <div className="rounded-xl shadow-lg bg-white/80 p-4 h-full flex flex-col">
                    <div className="flex items-center mb-4">
                        {role === USER_ROLE.recepcionista && <BsFillPersonFill className="text-pink-400 text-2xl mr-2" />}
                        {role === USER_ROLE.profesional && <RiUserStarFill className="text-pink-400 text-2xl mr-2" />}
                        <span className="font-bold text-lg">{role === USER_ROLE.recepcionista ? "Recepcionista" : ("Bienvenida " + nombreProfesional(session?.user?.email))}</span>
                        <span className="ml-auto text-xs text-gray-500">
                            {arribos.length} / 20
                        </span>
                    </div>
                    {arribos.length > 0 && role === USER_ROLE.profesional && <div className="flex rounded p-2 text-gray-400 bg-gray-100 mb-2">
                        <RiDragDropLine size="4rem" />
                        <span className="px-2 text-sm">Toma al paciente y arrastralo hacia el box en dónde lo atenderás.</span>
                    </div>}
                    {role === USER_ROLE.recepcionista && <button
                        className="mb-4 px-3 py-2 rounded-full bg-[#66754c] hover:bg-[#8c9b6d] text-white font-semibold shadow-md shadow-neutral-400 transition"
                        onClick={() => {
                            setRutBusqueda("");
                            setPacienteEncontrado(null);
                            setNuevoPacienteModal(true);
                        }}
                    >
                        + Recibir paciente
                    </button>}
                    <div className="flex flex-col gap-2 overflow-y-auto">
                        {!loading && arribos.length === 0 && (
                            <div className="text-center text-gray-400 mt-8">Sin pacientes en espera</div>
                        )}
                        {arribos.map((arribo, idx) => (
                            <div
                                key={`paciente-${idx}`}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm cursor-grab active:cursor-grabbing transition-all border border-pink-200 bg-white hover:bg-pink-50`}
                                draggable={role === USER_ROLE.profesional}
                                onDragStart={() => onDragStart(arribo)}
                                onDragEnd={onDragEnd}
                                style={{ opacity: draggedPaciente?.id === arribo.id ? 0.5 : 1 }}
                            >
                                {arribo.pacienteId?.genero === "F" && (
                                    <AiOutlineWoman className="text-2xl text-pink-500" />
                                )}
                                {arribo.pacienteId?.genero === "M" && (
                                    <AiOutlineMan className="text-2xl text-blue-500" />
                                )}
                                {arribo.pacienteId?.genero === "O" && (
                                    <FaPersonCircleQuestion className="text-2xl text-neutral-500" />
                                )}
                                <span className="font-medium">{arribo.pacienteId?.nombres} {arribo.pacienteId?.apellidos?.split(" ")[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>}
                {loading && <div className="rounded-xl shadow-lg bg-white/80 h-full flex flex-col items-center justify-center">
                    <Loader texto="Cargando..." />
                </div>}
            </section>

            {/* Boxes */}
            <section className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8 content-start">
                {boxes.map((box, idx) => (
                    <div
                        key={box._id}
                        className={`relative rounded-xl shadow-lg flex flex-col items-center justify-center h-40 transition-all
                            ${boxLibre(box) ? "text-[#66754c] bg-[#f6eedb] border-2 border-dashed border-[#d5c7aa]" : "text-white bg-[#8c966d] border-2 border-[#d5c7aa]"}
                            ${draggedPaciente && boxLibre(box) ? "ring-2 ring-pink-300" : ""}
                        `}
                        onDragOver={(e) => {
                            if (boxLibre(box)) e.preventDefault();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            onDropBox(box);
                        }}
                    >
                        {boxLibre(box) ? <LuDoorOpen className="text-4xl mb-2 text-[#d5c7aa]" /> : <LuDoorClosed className="text-4xl mb-2 text-white" />}
                        <div className="font-bold text-lg mb-1">Box {box.numero}</div>
                        {boxLibre(box) ? (
                            <div className="text-sm text-gray-400 mt-4">Libre</div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    {box.pacienteId.genero === "F" && <AiOutlineWoman className="text-2xl text-pink-600" />}
                                    {box.pacienteId.genero === "M" && <AiOutlineMan className="text-2xl text-blue-600" />}
                                    {box.pacienteId.genero === "O" && <FaPersonCircleQuestion className="text-2xl text-neutral-600" />}
                                    <span className="font-medium">{box.pacienteId.nombres} {box.pacienteId.apellidos?.split(" ")[0]}</span>
                                    <span className="font-medium">{box.profesionalId?.name ?? ''}</span>
                                </div>
                                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#fad379] transition-all"
                                        style={{
                                            width: `${Math.min(100, Math.round(
                                                ((Date.now() - new Date(box.inicioAtencion).getTime()) /
                                                    ((box.ocupacion?.tiempoEstimado || 60) * 60 * 1000)) * 100
                                            ))}%`
                                        }}
                                    />
                                </div>
                                <div className="text-xs text-gray-100 mt-1">
                                    {(() => {
                                        const inicioTime = new Date(box.inicioAtencion).getTime();
                                        const tiempoEstimado = box.ocupacion?.tiempoEstimado || 60; // minutos
                                        const finEstimado = inicioTime + (tiempoEstimado * 60 * 1000);
                                        const tiempoRestante = Math.max(0, finEstimado - Date.now());
                                        const minutosRestantes = Math.floor(tiempoRestante / (60 * 1000));
                                        const segundosRestantes = Math.floor((tiempoRestante % (60 * 1000)) / 1000);

                                        if (minutosRestantes > 0) {
                                            return `${minutosRestantes}m ${segundosRestantes}s restantes`;
                                        } else {
                                            return `${segundosRestantes}s restantes`;
                                        }
                                    })()}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </section>

            {/* Modal de confirmación */}
            <Dialog open={modal.open} onClose={() => setModal({ open: false, paciente: null, box: null })} className="fixed z-50 inset-0 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/30" />
                <div className="relative bg-[#EFEADE] rounded-xl shadow-xl p-8 z-10 w-96">
                    <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                        onClick={() => setModal({ open: false, paciente: null, box: null })}
                    >
                        <IoMdClose size={22} />
                    </button>
                    <DialogTitle className="font-bold text-lg mb-4 text-pink-400">Confirmar asignación</DialogTitle>
                    <div className="flex items-center gap-2 mb-4 bg-red-50 p-3 rounded-lg">
                        {/* Color según genero */}
                        {modal.paciente?.genero === "F" && (
                            <AiOutlineWoman className="text-2xl text-pink-300" />
                        )}
                        {modal.paciente?.genero === "M" && (
                            <AiOutlineMan className="text-2xl text-blue-300" />
                        )}
                        {modal.paciente?.genero === "O" && (
                            <FaPersonCircleQuestion className="text-2xl text-green-400" />
                        )}
                        <span className="font-medium">{modal.paciente?.nombres} {modal.paciente?.apellidos?.split(" ")[0]}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <MdOutlineMeetingRoom className="text-2xl text-sky-300" />
                        <span className="font-medium">Box {modal.box?.numero}</span>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Duración estimada</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min={0}
                                max={12}
                                value={modal.box?.horas ?? 1}
                                onChange={e => {
                                    const horas = Math.max(0, Math.min(12, Number(e.target.value)));
                                    setModal(modal => ({
                                        ...modal,
                                        box: {
                                            ...modal.box,
                                            horas,
                                        }
                                    }));
                                }}
                                className="w-16 rounded-md border border-gray-300 px-2 py-1"
                                placeholder="Horas"
                            />
                            <span className="self-center">:</span>
                            <input
                                type="number"
                                min={0}
                                max={59}
                                value={modal.box?.minutos ?? 0}
                                onChange={e => {
                                    const minutos = Math.max(0, Math.min(59, Number(e.target.value)));
                                    setModal(modal => ({
                                        ...modal,
                                        box: {
                                            ...modal.box,
                                            minutos,
                                        }
                                    }));
                                }}
                                className="w-16 rounded-md border border-gray-300 px-2 py-1"
                                placeholder="Minutos"
                            />
                            <span className="self-center"> Hrs : Mins</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button
                            className="flex-1 rounded-md bg-green-300 hover:bg-green-400 text-white font-semibold py-2 transition"
                            onClick={confirmarAsignacion}
                        >
                            Confirmar
                        </button>
                        <button
                            className="flex-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 transition"
                            onClick={() => setModal({ open: false, paciente: null, box: null })}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* Modal nuevo paciente */}
            <Dialog open={nuevoPacienteModal} onClose={() => setNuevoPacienteModal(false)} className="fixed z-50 inset-0 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/30" />
                <div className="relative bg-[#f6eedb] rounded-xl shadow-xl p-8 z-10 w-lg border border-[#d5c7aa]">
                    <button
                        className="absolute top-2 right-2 text-[#8e9b6d] hover:text-[#68563c] transition-colors"
                        onClick={() => setNuevoPacienteModal(false)}
                    >
                        <IoMdClose size={22} />
                    </button>
                    <DialogTitle className="font-bold text-lg mb-4 text-[#6a3858]">Registrar paciente</DialogTitle>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-[#68563c] mb-1">RUT del paciente</label>
                        <div className="flex gap-2">
                            <RutInput
                                value={rutBusqueda}
                                onChange={setRutBusqueda}
                                className="flex-1 rounded border border-[#d5c7aa] px-3 py-2 text-2xl w-60 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                placeholder="Ej: 12.345.678-9"
                            />
                            <button
                                className="rounded bg-[#66754c] hover:bg-[#8e9b6d] text-white h-12 w-12 flex flex-col items-center justify-center shadow transition"
                                onClick={async () => {
                                    if (!rutBusqueda.trim()) return;
                                    setSearching(true);
                                    const response = await fetch(`/api/recepcion/pacientePorRut?rut=${encodeURIComponent(rutBusqueda)}`);
                                    const data = await response.json();
                                    if (data.ok && data.paciente) {
                                        setPacienteEncontrado(data.paciente);
                                    } else {
                                        setPacienteEncontrado({
                                            nombres: "",
                                            apellidos: "",
                                            rut: rutBusqueda,
                                            nombreSocial: null,
                                            nuevo: true
                                        });
                                    }
                                    setSearching(false);
                                }}
                                type="button"
                                title="Buscar"
                            >
                                {!searching ? (
                                    <LuSearch size="2.4rem" />
                                ) : (<div className="w-full text-center ml-2 pl-0.5"><Loader texto="" /></div>)}
                            </button>
                        </div>
                    </div>
                    {pacienteEncontrado && (
                        <div className="mb-4 p-4 rounded-lg bg-[#fad379]/20 border border-[#fad379] flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                {pacienteEncontrado.genero == "F" ? (
                                    <AiOutlineWoman className="text-2xl text-pink-500" />
                                ) : pacienteEncontrado.genero == "M" ? (
                                    <AiOutlineMan className="text-2xl text-blue-500" />
                                ) : (
                                    <FaPersonCircleQuestion className="text-2xl text-[#8e9b6d]" />
                                )}
                                <div>
                                    <div className="font-semibold text-[#68563c]">
                                        {pacienteEncontrado.nuevo
                                            ? "Nuevo paciente"
                                            : (pacienteEncontrado.nombres + " " + pacienteEncontrado.apellidos)}
                                    </div>
                                    <div className="text-xs text-[#8e9b6d]">{pacienteEncontrado.rut}</div>
                                </div>
                            </div>
                            {pacienteEncontrado.nuevo && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            value={pacienteEncontrado.nombres}
                                            onChange={e =>
                                                setPacienteEncontrado(prev => ({
                                                    ...prev,
                                                    nombres: e.target.value,
                                                }))
                                            }
                                            placeholder="Nombre completo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#68563c] mb-1">Género</label>
                                        <select
                                            className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                            value={pacienteEncontrado.genero}
                                            onChange={e =>
                                                setPacienteEncontrado(prev => ({
                                                    ...prev,
                                                    genero: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Selecciona...</option>
                                            <option value="F">Femenino</option>
                                            <option value="M">Masculino</option>
                                            <option value="O">Otro</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <input
                                            type="checkbox"
                                            id="tratoEspecial"
                                            checked={!!pacienteEncontrado.tratoEspecial}
                                            onChange={e =>
                                                setPacienteEncontrado(prev => ({
                                                    ...prev,
                                                    tratoEspecial: e.target.checked,
                                                    nombreSocial: e.target.checked ? (prev.nombreSocial || "") : ""
                                                }))
                                            }
                                            className="mr-2 accent-[#66754c]"
                                        />
                                        <label htmlFor="tratoEspecial" className="text-sm font-semibold text-[#68563c]">Trato especial</label>
                                    </div>
                                    {pacienteEncontrado.tratoEspecial && (
                                        <div className="mt-2">
                                            <label className="block text-sm font-semibold text-[#68563c] mb-1">Nombre social</label>
                                            <input
                                                type="text"
                                                className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                                value={pacienteEncontrado.nombreSocial || ""}
                                                onChange={e =>
                                                    setPacienteEncontrado(prev => ({
                                                        ...prev,
                                                        nombreSocial: e.target.value,
                                                    }))
                                                }
                                                placeholder="Nombre social"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2 mt-6 h-12">
                        <button
                            className="flex-1 rounded-full bg-[#66754c] hover:bg-[#8e9b6d] text-white font-semibold py-2 transition disabled:opacity-50 shadow"
                            disabled={loading || !pacienteEncontrado || !pacienteEncontrado.nombres || !pacienteEncontrado.genero}
                            onClick={() => registrarArribo(pacienteEncontrado)}
                        >{registrandoArribo ? <Loader texto="Registrando..." /> : "Aceptar"}
                        </button>
                        <button
                            className="flex-1 rounded-full bg-[#d5c7aa] hover:bg-[#ac9164] text-[#68563c] hover:text-white font-semibold py-2 transition shadow"
                            onClick={() => {
                                setNuevoPacienteModal(false);
                                setPacienteEncontrado(null);
                                setRutBusqueda("");
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* CiPower floating button */}
            <button
                className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-full p-4 border border-gray-200 hover:bg-pink-100 transition flex items-center justify-center"
                title="CiPower"
                onClick={() => { }}
            >
                {/* SVG CiPower logo (placeholder) */}
                <CiPower className="text-3xl text-[#68563c]" />
            </button>
            <ToastContainer />
        </main>
    );
}