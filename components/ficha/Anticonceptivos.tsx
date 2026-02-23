import { useQuery } from "@tanstack/react-query";
import { UseFormRegister } from "react-hook-form";
import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm } from "./types";

export default function Anticonceptivos({ 
    register
 }: {     
    register: UseFormRegister<IFichaForm>;
}) { 
    const { data: metodosAnticonceptivos } = useQuery({
        queryKey: ["metodosAnticonceptivos"],
        queryFn: async () => {
            const response = await fetch("/api/anticonceptivos");
            const data = await response.json();
            return data;
        }
    });

    return <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
            <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">
                    <FaCaretSquareRight size="1.2rem" />
                </span>
                Métodos Anticonceptivos
            </summary>
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {metodosAnticonceptivos && metodosAnticonceptivos.map((item: { nombre: string }, index: number) => (
                        <label key={index} className="flex items-center gap-2">
                            <span className="text-sm text-[#68563c]">{item.nombre}</span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Otro método anticonceptivo..."
                        className="flex-1 border border-[#d5c7aa] rounded px-3 py-2 bg-white text-sm focus:border-[#ac9164]"
                        {...register("paciente.otroAnticonceptivo")}                        
                    />
                    <button className="bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]">
                        Agregar
                    </button>
                </div>
            </div>
        </details>
    </div>;
}