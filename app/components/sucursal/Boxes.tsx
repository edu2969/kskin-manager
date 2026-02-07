import { useRef, useState } from "react";
import { IBox, IPaciente } from "./types";
import { LuDoorClosed, LuDoorOpen } from "react-icons/lu";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";

const boxLibre = (box: IBox) => {
    // 1. Sin paciente o profesional → LIBRE
    if (!box.pacienteId || !box.profesionalId) return true;

    // 2. ✅ NUEVO: Tiene terminoAtencion → LIBRE (atención completada)
    if (box.terminoAtencion) return true;

    // 3. Sin inicio de atención → LIBRE  
    if (!box.inicioAtencion) return true;

    // 4. Tiempo estimado cumplido → LIBRE
    const inicioTime = new Date(box.inicioAtencion).getTime();
    const tiempoEstimado = box.ocupacion?.tiempoEstimado || 60;
    const finEstimado = inicioTime + (tiempoEstimado * 60 * 1000);
    return Date.now() > finEstimado;
}

export default function Boxes({
    boxes,
    setBoxes,
    paciente,
    iniciarProgreso
}: {
    boxes: IBox[];
    setBoxes: React.Dispatch<React.SetStateAction<IBox[]>>;
    paciente: IPaciente | null;
    iniciarProgreso: (boxId: string) => void;
}) {
    const [boxSelected, setBoxSelected] = useState<IBox | null>(null);    

    return (<section className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8 content-start">
        {boxes.map((box, idx) => (
            <div
                key={`box_${idx}`}
                className={`relative rounded-xl shadow-lg flex flex-col items-center justify-center h-40 transition-all
                            ${boxLibre(box) ? "text-[#66754c] bg-[#f6eedb] border-2 border-dashed border-[#d5c7aa]" : "text-white bg-[#8c966d] border-2 border-[#d5c7aa]"}
                            ${paciente && boxLibre(box) ? "ring-2 ring-pink-300" : ""}
                            ${boxSelected?._id === box._id ? "bg-pink-200 text-pink-800" : ""}
                        `}
                onClick={() => {
                    setBoxSelected(box);
                }}
                data-box-id={box._id}
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
                                        ((Date.now() - (box.inicioAtencion || new Date()).getTime()) /
                                            ((box.ocupacion?.tiempoEstimado || 60) * 60 * 1000)) * 100
                                    ))}%`
                                }}
                            />
                        </div>
                        <div className="text-xs text-gray-100 mt-1">
                            {(() => {
                                const inicioTime = new Date(box.inicioAtencion ?? new Date()).getTime();
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
    </section>);
}