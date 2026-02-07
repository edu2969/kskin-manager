import { useState } from "react";
import { USER_ROLE } from "@/app/utils/constants";
import { BsFillPersonFill } from "react-icons/bs";
import { RiDragDropLine, RiUserStarFill } from "react-icons/ri";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import toast from "react-hot-toast";
import Loader from "../Loader";
import { IArribo, IPaciente } from "./types";
import ModalNuevoPaciente from "./ModalNuevoPaciente";
import { socket } from "@/lib/socket-client";
import ModalHistorico from "./ModalHistorico";

export default function Recepcion({
    role, nombreProfesional, arribos, setArribo, onClose
}: {
    role: number;
    nombreProfesional: string;
    arribos: IArribo[];
    setArribo: React.Dispatch<React.SetStateAction<IArribo | null>>;
    onClose: () => void;
}) {
    const [paciente, setPaciente] = useState<IPaciente | null>(null);
    const [loading, setLoading] = useState(false);
    const [registrandoArribo, setRegistrandoArribo] = useState(false);
    const [showNuevoPaciente, setShowNuevoPaciente] = useState(false);
    const [rutBusqueda, setRutBusqueda] = useState("");
    const [pacienteEncontrado, setPacienteEncontrado] = useState<IPaciente | null>(null);    
    const [showModalHistorico, setShowModalHistorico] = useState<string | boolean>(false);
        
    const registrarArribo = async (paciente: IPaciente) => {
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
                setPaciente(null);
                setRutBusqueda("");
            } else {
                toast.error(data.error || "Error al registrar arribo");
            }
        } catch (err) {
            toast.error("Error de red al registrar arribo");
        } finally {
            setRegistrandoArribo(false);
            socket.emit("update-centrointegral");
        }
    };

    return (<section className="w-80 h-full p-4">
        {!loading && <div className="rounded-xl shadow-lg bg-white/80 p-4 h-full flex flex-col">
            <div className="flex items-center mb-4">
                {role === USER_ROLE.recepcionista && <BsFillPersonFill className="text-pink-400 text-2xl mr-2" />}
                {role === USER_ROLE.profesional && <RiUserStarFill className="text-pink-400 text-2xl mr-2" />}
                <span className="font-bold text-lg">{role === USER_ROLE.recepcionista ? "Recepcionista" : ("Bienvenida " + nombreProfesional)}</span>
                <span className="ml-auto text-xs text-gray-500">
                    {arribos.length} / 20
                </span>
            </div>
            {/* Link único para ver histórico de paciente (solo profesional) */}
            {role === USER_ROLE.profesional && (
                <div className="mb-4">
                    <button
                        className="px-3 py-2 rounded-full bg-pink-200 hover:bg-pink-300 text-pink-800 font-semibold shadow transition"
                        onClick={() => setShowModalHistorico('buscar')}
                    >
                        Ver histórico de paciente
                    </button>
                </div>
            )}
            {arribos.filter(a => a.fechaLlegada).length > 0 && role === USER_ROLE.profesional && <div className="flex rounded p-2 text-gray-400 bg-gray-100 mb-2">
                <RiDragDropLine size="4rem" />
                <span className="px-2 text-sm">Selecciona el paciente y luego el box en dónde lo atenderás.</span>
            </div>}
            {role === USER_ROLE.recepcionista && <button
                className="mb-4 px-3 py-2 rounded-full bg-[#66754c] hover:bg-[#8c9b6d] text-white font-semibold shadow-md shadow-neutral-400 transition"
                onClick={() => {
                    setRutBusqueda("");
                    setPacienteEncontrado(null);
                    setShowNuevoPaciente(true);
                }}
            >
                + Recibir paciente
            </button>}
            <div className="flex flex-col gap-2 overflow-y-auto">
                {!loading && arribos.filter(a => a.fechaLlegada).length === 0 && (
                    <div className="text-center text-gray-400 mt-8">Sin pacientes en espera</div>
                )}
                {arribos.filter(a => a.fechaLlegada).map((arribo, idx) => (<div
                    key={`paciente-${idx}`}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 shadow-sm cursor-grab active:cursor-grabbing transition-all border border-pink-200 ${arribo.pacienteId._id === paciente?._id ? "bg-pink-500 text-white" : "bg-white hover:bg-pink-50"}`}
                    onClick={() => {
                        setArribo(arribo);                        
                        toast.success("Paciente seleccionado para asignar box");                        
                    }}
                    style={{ opacity: paciente?._id === arribo._id ? 0.5 : 1 }}
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
                </div>))}
            </div>
        </div>}
        {loading && <div className="rounded-xl shadow-lg bg-white/80 h-full flex flex-col items-center justify-center">
            <Loader texto="Cargando..." />
        </div>}        
        
        <ModalNuevoPaciente show={showNuevoPaciente}
            setPaciente={setPaciente}
            onClose={() => setShowNuevoPaciente(false)} />


        <ModalHistorico show={showModalHistorico}
            setShow={setShowModalHistorico}
            onClose={() => setShowModalHistorico(false)} />

    </section>)
}