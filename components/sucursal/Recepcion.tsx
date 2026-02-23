import { useState } from "react";
import { USER_ROLE } from "@/app/utils/constants";
import { BsFileEarmarkMedicalFill, BsFillPersonFill } from "react-icons/bs";
import { RiDragDropLine, RiUserStarFill } from "react-icons/ri";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import { GiArchiveRegister } from "react-icons/gi";
import toast from "react-hot-toast";
import Loader from "../Loader";
import { IArribo, IBox, INuevoArribo, IPaciente } from "./types";
import ModalHistorico from "@/components/modals/ModalHistorico";
import ModalRegistroPaciente from "@/components/modals/ModalRegistroPaciente";
import { useQueryClient } from "@tanstack/react-query";

export default function Recepcion({
    rol, arribos, nombreProfesional, pacienteSeleccionado, setPacienteSeleccionado, boxSeleccionado, solicitarReserva
}: {
    rol: number;
    arribos: IArribo[];    
    nombreProfesional: string;
    pacienteSeleccionado: IPaciente | null;
    setPacienteSeleccionado: React.Dispatch<React.SetStateAction<IPaciente | null>>;
    boxSeleccionado: IBox | null;
    solicitarReserva: (paciente: INuevoArribo | null, box: IBox | null) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [showNuevoPaciente, setShowNuevoPaciente] = useState(false);
    const [showModalHistorico, setShowModalHistorico] = useState<string | boolean>(false);
    const queryClient = useQueryClient();

    const registrarArribo = async (nuevoArribo: INuevoArribo) => {
        setLoading(true);
        try {
            const nombreCompletoSeparado = (nuevoArribo.nombreCompleto || "").split(" ");
            const cantidadNombre = nombreCompletoSeparado.length === 5 ? 3 : nombreCompletoSeparado.length === 2 ? 1 : 2;            
            const body = {
                    paciente: {
                        nombres: nombreCompletoSeparado.slice(0, cantidadNombre).join(" "),
                        apellidos: nombreCompletoSeparado.slice(cantidadNombre).join(" "),
                        numeroIdentidad: nuevoArribo.numeroIdentidad,
                        genero: nuevoArribo.genero,
                        nombreSocial: nuevoArribo.nombreSocial || ""
                    },
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
                setPacienteSeleccionado(null);
                queryClient.invalidateQueries({ queryKey: ["panoramica"] });
            } else {
                toast.error(data.error || "Error al registrar arribo");
            }
        } catch {
            toast.error("Error de red al registrar arribo");
        } finally {
            setLoading(false);
        }
    };

    const handleSeleccionarPaciente = (arribo: IArribo) => {
        if(rol !== USER_ROLE.profesional) return;
        setPacienteSeleccionado(arribo.paciente);
        solicitarReserva(!arribo.paciente.id ? {
            id: arribo.paciente.id,
            numeroIdentidad: arribo.paciente.numeroIdentidad,
            nombreCompleto: arribo.paciente.nombres + " " + arribo.paciente.apellidos,
            genero: arribo.paciente.genero,
            tratoEspecial: arribo.paciente.tratoEspecial,
            nombreSocial: arribo.paciente.nombreSocial || undefined
        } : {
            id: arribo.paciente.id
        }, boxSeleccionado);
    }

    return (<section className="w-2/5 md:w-80 h-full p-0.5 md:p-4">
        {!loading && <div className="rounded-xl shadow-lg bg-white/80 p-1 md:p-4 h-full flex flex-col">
            <div className="flex flex-col items-center mb-4">
                <p className="text-lg text-center">{rol === USER_ROLE.recepcionista ? "Recepcionista" : <b>{"Bienvenida " + nombreProfesional}</b>}</p>                
                <div className="flex">
                    {rol === USER_ROLE.recepcionista && <BsFillPersonFill className="text-pink-400 text-2xl mr-2" />}
                    {rol === USER_ROLE.profesional && <RiUserStarFill className="text-pink-400 text-2xl mr-2" />}
                    <p className="font-bolder ml-auto text-xs text-gray-800 bg-pink-200 px-2 py-0.5 rounded-md">
                        {arribos.length} / 20
                    </p>
                </div>                
            </div>
            {/* Link único para ver histórico de paciente (solo profesional) */}
            {rol === USER_ROLE.profesional && (
                <div className="mb-1">
                    <button
                        className="w-full mb-4 px-4 pt-2 pb-1 md:px-3 md:py-2 rounded-xl bg-[#66754c] hover:bg-[#8c9b6d] text-white font-semibold shadow-md shadow-neutral-400 transition"
                        onClick={() => setShowModalHistorico('buscar')}
                    >
                        <BsFileEarmarkMedicalFill size="3rem" className="m-auto"/>
                        <p className="text-center">Ver histórico de paciente</p>
                    </button>
                </div>
            )}
            {arribos.filter(a => a.fechaAtencion).length > 0 && rol === USER_ROLE.profesional && <div className="flex rounded p-1 md:p-2 text-gray-400 bg-gray-100 mb-2">
                <RiDragDropLine size="4rem" />
                <span className="px-2 text-sm">Selecciona su paciente y el box</span>
            </div>}
            <button className="mb-4 pl-4 py-1 md:px-3 md:py-2 rounded-xl bg-[#66754c] hover:bg-[#8c9b6d] text-white font-semibold shadow-md shadow-neutral-400 transition"
                onClick={() => {
                    setShowNuevoPaciente(true);
                }}
            >
                <div className="flex items-center gap-3 justify-center">
                    <GiArchiveRegister size="2rem"/>
                    <p className="text-left">Recibir paciente</p>
                </div>                
            </button>
            <div className="flex flex-col gap-0.5 md:gap-2 overflow-y-auto">
                {!loading && arribos.length === 0 && (
                    <div className="text-center text-gray-400 mt-8">Sin pacientes en espera</div>
                )}
                {arribos && arribos.map((arribo, idx) => (<div
                    key={`paciente-${idx}`}
                    className={`flex items-center gap-0.5 md:gap-2 
                        rounded-lg px-1 md:px-3 py-1 md:py-2 shadow-sm cursor-grab 
                        border border-pink-200 
                        ${(arribo?.paciente?.id === pacienteSeleccionado?.id) 
                            ? "bg-pink-300 text-white" : "bg-pink-100 text-gray-500"}`}
                    onClick={() => handleSeleccionarPaciente(arribo)}
                >
                    {arribo.paciente.genero === "F" && (
                        <AiOutlineWoman className="text-2xl text-pink-500" />
                    )}
                    {arribo.paciente.genero === "M" && (
                        <AiOutlineMan className="text-2xl text-blue-500" />
                    )}
                    {arribo.paciente.genero === "O" && (
                        <FaPersonCircleQuestion className="text-2xl text-neutral-500" />
                    )}
                    <span className="font-medium">{arribo.paciente.nombres} {arribo.paciente.apellidos?.split(" ")[0]}</span>
                </div>))}
            </div>
        </div>}
        {loading && <div className="rounded-xl shadow-lg bg-white/80 h-full flex flex-col items-center justify-center">
            <Loader texto="Cargando..." />
        </div>}        
        
        <ModalRegistroPaciente show={showNuevoPaciente}
            registrarArribo={registrarArribo}
            onClose={() => {
                setShowNuevoPaciente(false);                
            }} />

        <ModalHistorico show={showModalHistorico}        
            setShow={setShowModalHistorico}
            onClose={() => setShowModalHistorico(false)} />

    </section>)
}