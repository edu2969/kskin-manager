import { IBox, INuevoArribo, IPaciente } from "./types";
import { LuDoorClosed, LuDoorOpen } from "react-icons/lu";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import { USER_ROLE } from "@/app/utils/constants";

const boxLibre = (box: IBox) => {
    return box.paciente == null;    
}

export default function Boxes({
    role,
    boxes,    
    boxSeleccionado,
    setBoxSeleccionado,
    solicitarReserva,
    pacienteSeleccionado
}: {
    role: number;
    boxes: IBox[];
    boxSeleccionado: IBox | null;
    setBoxSeleccionado: React.Dispatch<React.SetStateAction<IBox | null>>;
    solicitarReserva: (paciente: INuevoArribo | null, box: IBox | null) => void;
    pacienteSeleccionado: IPaciente | null;
}) {
    const handleBoxSeleccionado = (box: IBox) => {
        if(role !== USER_ROLE.profesional) return;        
        setBoxSeleccionado(box);
        if(!pacienteSeleccionado) return;
        const nuevoArribo = {
            id: pacienteSeleccionado?.id || ""
        }
        solicitarReserva(nuevoArribo, box);
    }

    return (<section className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0.5 md:gap-6 p-0.5 md:p-8 content-start">
        {boxes.sort((a, b) => a.numero - b.numero).map((box, idx) => (
            <div
                key={`box_${idx}`}
                className={`relative rounded-xl shadow-lg flex flex-col items-center justify-center h-28 md:h-40 transition-all
                            ${boxLibre(box) ? "text-[#66754c] bg-[#f6eedb] border-2 border-dashed border-[#d5c7aa]" : "text-white bg-[#8c966d] border-2 border-[#d5c7aa]"}
                            ${pacienteSeleccionado && boxLibre(box) ? "ring-2 ring-pink-300" : ""}
                            ${boxSeleccionado?.id === box.id ? "bg-pink-300 text-pink-800" : ""}
                        `}
                onClick={() => handleBoxSeleccionado(box)}
                data-box-id={box.id}
            >
                <div className="flex">
                    {boxLibre(box) ? <LuDoorOpen className={`text-4xl mb-0 md:mb-2 ${boxSeleccionado?.id === box.id ? "text-white" : "text-[#d5c7aa]"}`} /> : <LuDoorClosed className="text-4xl mb-2 text-white" />}
                    <div className="font-bold text-lg mb-1"><span className="text-sm">Box</span> {box.numero}</div>
                </div>
                {boxLibre(box) ? (
                    <div className={`text-sm mt-4 ${boxSeleccionado?.id === box.id ? "text-white font-bold" : "text-green-600"}`}>Libre</div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-2">
                            {box.paciente.genero === "F" && <AiOutlineWoman className="text-2xl text-pink-600" />}
                            {box.paciente.genero === "M" && <AiOutlineMan className="text-2xl text-blue-600" />}
                            {box.paciente.genero === "O" && <FaPersonCircleQuestion className="text-2xl text-neutral-600" />}
                            <div className=" overflow-ellipsis whitespace-nowrap max-w-80">
                                <span className="font-medium">{box.paciente.nombres} {box.paciente.apellidos.substring(0, 1)}.</span>
                                <span className="font-medium">{box.profesional?.usuarioId?.nombre ?? ''}</span>
                            </div>                            
                        </div>
                        <div className="w-24 md:w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#fad379] transition-all"
                                style={{
                                    width: `${Math.min(100, Math.round(
                                        ((Date.now() - (box.inicioAtencion || new Date()).getTime()) /
                                            ((box.inicioAtencion?.getTime() || 60) * 60 * 1000)) * 100
                                    ))}%`
                                }}
                            />
                        </div>
                        <div className="text-xs text-gray-100 mt-1">
                            {(() => {
                                const inicioTime = new Date(box.inicioAtencion ?? new Date()).getTime();
                                const tiempoEstimado = box.terminoAtencion ? 60 : 0; // minutos
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
    </section>);
}