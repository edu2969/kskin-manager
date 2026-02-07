
import { Dialog, DialogTitle } from "@headlessui/react";
import { useRef, useState } from "react";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { MdOutlineMeetingRoom } from "react-icons/md";
import { IBox, IPaciente } from "./types";
import toast from "react-hot-toast";
import { USER_ROLE } from "@/app/utils/constants";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket-client";
import Loader from "../Loader";

export default function ModalConfirmacionReserva({
    show, role, paciente, box, onClose, iniciarProgreso, setBox
}: {
    show: boolean;
    role: number;
    paciente: IPaciente | null;
    box: IBox | null;
    iniciarProgreso: (boxId: string) => void;
    onClose: () => void;
    setBox: React.Dispatch<React.SetStateAction<IBox | null>>;
}) {
    const [confirmandoAsignacion, setConfirmandoAsignacion] = useState(false);    
    
    const router = useRouter();

        

    const confirmarAsignacion = () => {
        if (!paciente || !box || (box.horas + box.minutos === 0)) {
            toast.error("Faltan datos para asignar box");
            return;
        }

        const tiempoEstimado = ((box.horas ?? 0) * 60) + (box.minutos ?? 0);

        const asignacionExitosa = () => {
            if (role === USER_ROLE.profesional) {
                router.push("/modulos/ficha/" + paciente._id);
            } else {
                setBox(null);
                iniciarProgreso(box._id);
            }
        }

        setConfirmandoAsignacion(true);

        fetch("/api/profesional/asignacion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                boxId: box?._id,
                pacienteId: paciente?._id,
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
            })
            .finally(() => {
                setConfirmandoAsignacion(false);
            });

        // Asignar paciente al box

    };

    return (<Dialog open={show} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" />
        <div className="relative bg-[#EFEADE] rounded-xl shadow-xl p-8 z-10 w-[400px]">
            <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                onClick={onClose}
            >
                <IoMdClose size={22} />
            </button>
            <DialogTitle className="font-bold text-lg mb-4 text-pink-400">Confirmar asignación</DialogTitle>
            <div className="flex items-center gap-2 mb-4 bg-red-50 p-3 rounded-lg">
                {/* Color según genero */}
                {paciente?.genero === "F" && (
                    <AiOutlineWoman className="text-2xl text-pink-300" />
                )}
                {paciente?.genero === "M" && (
                    <AiOutlineMan className="text-2xl text-blue-300" />
                )}
                {paciente?.genero === "O" && (
                    <FaPersonCircleQuestion className="text-2xl text-green-400" />
                )}
                <span className="font-medium">{paciente?.nombres} {paciente?.apellidos?.split(" ")[0]}</span>
                <span className="mx-2 text-gray-400">→</span>
                <MdOutlineMeetingRoom className="text-2xl text-sky-300" />
                <span className="font-medium">Box {box?.numero}</span>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Duración estimada</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        min={0}
                        max={12}
                        value={box?.horas ?? 1}
                        onChange={e => {
                            const horas = Math.max(0, Math.min(12, Number(e.target.value)));
                            setBox(box);
                        }}
                        className="w-16 rounded-md border border-gray-300 px-2 py-1"
                        placeholder="Horas"
                    />
                    <span className="self-center">:</span>
                    <input
                        type="number"
                        min={0}
                        max={59}
                        value={box?.minutos ?? 0}
                        onChange={e => {
                            const minutos = Math.max(0, Math.min(59, Number(e.target.value)));
                            setBox((prevBox) => prevBox ? ({
                                ...prevBox,
                                minutos
                            }) : null);
                        }}
                        className="w-16 rounded-md border border-gray-300 px-2 py-1"
                        placeholder="Minutos"
                    />
                    <span className="self-center"> Hrs : Mins</span>
                </div>
            </div>
            <div className="flex gap-2 mt-6">
                <button
                    className="flex-1 rounded-md bg-green-300 hover:bg-green-400 text-white font-semibold py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={confirmarAsignacion}
                    disabled={confirmandoAsignacion}
                >
                    {confirmandoAsignacion ? <Loader texto="Confirmando..." /> : "Confirmar"}
                </button>
                <button
                    className="flex-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 transition disabled:opacity-50"
                    onClick={onClose}
                    disabled={confirmandoAsignacion}
                >
                    Cancelar
                </button>
            </div>
        </div>
    </Dialog>);
}