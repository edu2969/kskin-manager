// filepath: d:/git/kskin-manager/app/components/sucursal/Panoramica.jsx
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { FaUser, FaUserCircle } from "react-icons/fa";
import { MdOutlineMeetingRoom } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { BsFillPersonFill } from "react-icons/bs";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import { CiPower } from "react-icons/ci";

// Paleta de colores y equivalentes Tailwind (comentario de referencia):
// #F4A9D9 -> bg-pink-300
// #F5CFE8 -> bg-pink-100
// #DCBAE1 -> bg-purple-200
// #E8D7E9 -> bg-purple-100
// #A0CCE9 -> bg-sky-300
// #CBDFEF -> bg-sky-100
// #97E3BC -> bg-green-300
// #C6EBD9 -> bg-green-100

const COLORS = [
    "bg-pink-300",   // #F4A9D9
    "bg-pink-100",   // #F5CFE8
    "bg-purple-200", // #DCBAE1
    "bg-purple-100", // #E8D7E9
    "bg-sky-300",    // #A0CCE9
    "bg-sky-100",    // #CBDFEF
    "bg-green-300",  // #97E3BC
    "bg-green-100",  // #C6EBD9
];

const dummyPacientes = [
    { id: 1, nombre: "Camila Soto", rut: "19.234.567-2", nombreSocial: "F" },
    { id: 2, nombre: "Javier Morales", rut: "17.123.456-9", nombreSocial: "M" },
    { id: 3, nombre: "Valentina Rojas", rut: "20.345.678-1", nombreSocial: "F" },
    { id: 4, nombre: "Matías González", rut: "18.987.654-3", nombreSocial: "M" },
    { id: 5, nombre: "Fernanda Herrera", rut: "21.456.789-5", nombreSocial: "O" },
    { id: 6, nombre: "Ignacio Torres", rut: "16.876.543-7", nombreSocial: "M" },
    { id: 7, nombre: "Antonia Castro", rut: "15.765.432-4", nombreSocial: "O" },
    { id: 8, nombre: "Benjamín Silva", rut: "22.567.890-6", nombreSocial: "M" },
];

const dummyBoxes = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    ocupado: false,
    paciente: null,
    progreso: 0,
}));

function randomSeconds() {
    return Math.floor(Math.random() * 45) + 15; // 15 a 60 segundos
}

export default function Panoramica() {
    const [nuevoPacienteModal, setNuevoPacienteModal] = useState(false);
    const [rutBusqueda, setRutBusqueda] = useState("");
    const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
    const [pacientes, setPacientes] = useState(dummyPacientes);
    const [boxes, setBoxes] = useState(dummyBoxes);
    const [draggedPaciente, setDraggedPaciente] = useState(null);
    const [modal, setModal] = useState({ open: false, paciente: null, box: null });
    const timers = useRef({});

    // Drag & Drop handlers
    const onDragStart = (paciente) => setDraggedPaciente(paciente);
    const onDragEnd = () => setDraggedPaciente(null);

    const onDropBox = (box) => {
        if (!draggedPaciente || box.ocupado) return;
        setModal({ open: true, paciente: draggedPaciente, box });
    };

    // Confirmar asignación
    const confirmarAsignacion = () => {
        const { paciente, box } = modal;
        // Asignar paciente al box
        setBoxes((prev) =>
            prev.map((b) =>
                b.id === box.id
                    ? {
                        ...b,
                        ocupado: true,
                        paciente,
                        progreso: 0,
                        duracion: randomSeconds(),
                    }
                    : b
            )
        );
        setPacientes((prev) => prev.filter((p) => p.id !== paciente.id));
        setModal({ open: false, paciente: null, box: null });
        // Iniciar progreso
        iniciarProgreso(box.id);
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
        let duracion = boxes.find((b) => b.id === boxId)?.duracion || randomSeconds();
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

    // UI
    return (
        <main className="flex h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-green-100">
            {/* Recepción */}
            <section className="w-1/4 h-full p-4">
                <div className="rounded-xl shadow-lg bg-white/80 p-4 h-full flex flex-col">
                    <div className="flex items-center mb-4">
                        <BsFillPersonFill className="text-pink-400 text-2xl mr-2" />
                        <span className="font-bold text-lg">Recepción</span>
                        <span className="ml-auto text-xs text-gray-500">
                            {pacientes.length} / 20
                        </span>
                    </div>
                    <button
                        className="mb-4 px-3 py-2 rounded-md bg-pink-300 hover:bg-pink-400 text-white font-semibold transition"
                        onClick={() => {
                            setRutBusqueda("");
                            setPacienteEncontrado(null);
                            setNuevoPacienteModal(true);
                        }}
                    >
                        + Recibir paciente
                    </button>
                    <div className="flex flex-col gap-2 overflow-y-auto">
                        {pacientes.length === 0 && (
                            <div className="text-center text-gray-400 mt-8">Sin pacientes en espera</div>
                        )}
                        {pacientes.map((p, idx) => (
                            <div
                                key={p.id}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm cursor-grab active:cursor-grabbing transition-all border border-pink-200 bg-white hover:bg-pink-50`}
                                draggable
                                onDragStart={() => onDragStart(p)}
                                onDragEnd={onDragEnd}
                                style={{ opacity: draggedPaciente?.id === p.id ? 0.5 : 1 }}
                            >
                        {p.nombreSocial === "F" && (
                            <AiOutlineWoman className="text-2xl text-pink-300" />
                        )}
                        {p.nombreSocial === "M" && (
                            <AiOutlineMan className="text-2xl text-blue-300" />
                        )}
                        {p.nombreSocial === "O" && (
                            <FaPersonCircleQuestion className="text-2xl text-neutral-300" />
                        )}                                
                                <span className="font-medium">{p.nombre}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Boxes */}
            <section className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8 content-start">
                {boxes.map((box, idx) => (
                    <div
                        key={box.id}
                        className={`relative rounded-xl shadow-lg flex flex-col items-center justify-center h-40 transition-all
                            ${box.ocupado ? "bg-green-100 border-2 border-green-300" : "bg-white border-2 border-dashed border-sky-200"}
                            ${draggedPaciente && !box.ocupado ? "ring-2 ring-pink-300" : ""}
                        `}
                        onDragOver={(e) => {
                            if (!box.ocupado) e.preventDefault();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            onDropBox(box);
                        }}
                    >
                        <MdOutlineMeetingRoom className={`text-4xl mb-2 ${box.ocupado ? "text-green-400" : "text-sky-300"}`} />
                        <div className="font-bold text-lg mb-1">Box {box.id}</div>
                        {box.ocupado && box.paciente ? (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <FaUserCircle className="text-2xl text-pink-400" />
                                    <span className="font-medium">{box.paciente.nombre}</span>
                                </div>
                                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-300 transition-all"
                                        style={{ width: `${Math.min(100, Math.round(box.progreso * 100))}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {Math.round((box.duracion || 0) * (1 - box.progreso))}s restantes
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-gray-400 mt-4">Libre</div>
                        )}
                    </div>
                ))}
            </section>

            {/* Modal de confirmación */}
            <Dialog open={modal.open} onClose={() => setModal({ open: false, paciente: null, box: null })} className="fixed z-50 inset-0 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/30" />
                <div className="relative bg-white rounded-xl shadow-xl p-8 z-10 w-80">
                    <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                        onClick={() => setModal({ open: false, paciente: null, box: null })}
                    >
                        <IoMdClose size={22} />
                    </button>
                    <DialogTitle className="font-bold text-lg mb-4 text-pink-400">Confirmar asignación</DialogTitle>
                    <div className="flex items-center gap-2 mb-4">
                        {/* Color según nombreSocial */}
                        {modal.paciente?.nombreSocial === "F" && (
                            <AiOutlineWoman className="text-2xl text-pink-300" />
                        )}
                        {modal.paciente?.nombreSocial === "M" && (
                            <AiOutlineMan className="text-2xl text-blue-300" />
                        )}
                        {modal.paciente?.nombreSocial === "O" && (
                            <FaPersonCircleQuestion className="text-2xl text-green-400" />
                        )}
                        <span className="font-medium">{modal.paciente?.nombre}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <MdOutlineMeetingRoom className="text-2xl text-sky-300" />
                        <span className="font-medium">Box {modal.box?.id}</span>
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
                <div className="relative bg-white rounded-xl shadow-xl p-8 z-10 w-80">
                    <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                        onClick={() => setNuevoPacienteModal(false)}
                    >
                        <IoMdClose size={22} />
                    </button>
                    <DialogTitle className="font-bold text-lg mb-4 text-pink-400">Registrar paciente</DialogTitle>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">RUT del paciente</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 rounded-md border border-gray-300 px-2 py-1"
                                value={rutBusqueda}
                                onChange={e => setRutBusqueda(e.target.value)}
                                placeholder="Ej: 12.345.678-9"
                            />
                            <button
                                className="rounded-md bg-sky-300 hover:bg-sky-400 text-white px-2 py-1"
                                onClick={() => {
                                    // Simula búsqueda: si existe en dummy, lo muestra, si no, crea uno nuevo
                                    const encontrado = dummyPacientes.find(p => p.rut === rutBusqueda);
                                    if (encontrado) {
                                        setPacienteEncontrado(encontrado);
                                    } else if (rutBusqueda.trim()) {
                                        setPacienteEncontrado({
                                            id: Date.now(),
                                            nombre: "",
                                            rut: rutBusqueda,
                                            nombreSocial: "",
                                            nuevo: true,
                                        });
                                    }
                                }}
                                type="button"
                                title="Buscar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {pacienteEncontrado && (
                        <div className="mb-4 p-2 rounded bg-green-50 border border-green-200 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                {pacienteEncontrado.nombreSocial == "F" ? (
                                    <FaUserCircle className="text-2xl text-pink-300" />
                                ) : (
                                    <FaUserCircle className="text-2xl text-blue-300" />
                                )}
                                <div>
                                    <div className="font-medium">
                                        {pacienteEncontrado.nuevo
                                            ? "Nuevo paciente"
                                            : pacienteEncontrado.nombre}
                                    </div>
                                    <div className="text-xs text-gray-500">{pacienteEncontrado.rut}</div>
                                </div>
                            </div>
                            {pacienteEncontrado.nuevo && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-gray-300 px-2 py-1"
                                            value={pacienteEncontrado.nombre}
                                            onChange={e =>
                                                setPacienteEncontrado(prev => ({
                                                    ...prev,
                                                    nombre: e.target.value,
                                                }))
                                            }
                                            placeholder="Nombre completo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nombre social</label>
                                        <select
                                            className="w-full rounded-md border border-gray-300 px-2 py-1"
                                            value={pacienteEncontrado.nombreSocial}
                                            onChange={e =>
                                                setPacienteEncontrado(prev => ({
                                                    ...prev,
                                                    nombreSocial: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Selecciona...</option>
                                            <option value="F">Femenino</option>
                                            <option value="M">Masculino</option>
                                            <option value="O">Otro</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2 mt-6">
                        <button
                            className="flex-1 rounded-md bg-green-300 hover:bg-green-400 text-white font-semibold py-2 transition disabled:opacity-50"
                            disabled={
                                !pacienteEncontrado ||
                                (pacienteEncontrado.nuevo &&
                                    (!pacienteEncontrado.nombre ||
                                        !pacienteEncontrado.nombreSocial))
                            }
                            onClick={() => {
                                setPacientes(prev => [
                                    ...prev,
                                    {
                                        ...pacienteEncontrado,
                                        id: Date.now(),
                                    }
                                ]);
                                setNuevoPacienteModal(false);
                                setPacienteEncontrado(null);
                                setRutBusqueda("");
                            }}
                        >
                            Aceptar
                        </button>
                        <button
                            className="flex-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 transition"
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
                onClick={() => {}}
            >
                {/* SVG CiPower logo (placeholder) */}
                <CiPower className="text-3xl text-pink-400"/>
            </button>
        </main>
    );
}