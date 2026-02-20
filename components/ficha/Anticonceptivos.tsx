import { useMutation, useQuery } from "@tanstack/react-query";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm } from "./types";

export default function Anticonceptivos({ 
    register,
    setValue,
    onChange
 }: {     
    register: UseFormRegister<IFichaForm>;
    setValue: UseFormSetValue<IFichaForm>;
    onChange: (field: string, value: any) => void;
}) { 
    const { data: metodosAnticonceptivos, isLoading } = useQuery({
        queryKey: ["metodosAnticonceptivos"],
        queryFn: async () => {
            const response = await fetch("/api/catalogos/anticonceptivos");
            const data = await response.json();
            return data.map((item: any) => ({ glosa: item.glosa, checked: false }));
        }
    });

    const mutationAgregarMetodoAnticonceptivo = useMutation({
        mutationFn: async (nuevoMetodo: string) => {
            const response = await fetch("/api/catalogos/anticonceptivos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ glosa: nuevoMetodo })
            });
            if (!response.ok) {
                throw new Error("Error al agregar método anticonceptivo");
            }
            return response.json();
        }
    });

    const handleAgregarMetodoAnticonceptivo = (otroAnticonceptivo: string) => {        
        mutationAgregarMetodoAnticonceptivo.mutate(otroAnticonceptivo);
    }

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
                    {metodosAnticonceptivos.map((item: string, index: number) => (
                        <label key={index} className="flex items-center gap-2">
                            <span className="text-sm text-[#68563c]">{item}</span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Otro método anticonceptivo..."
                        className="flex-1 border border-[#d5c7aa] rounded px-3 py-2 bg-white text-sm focus:border-[#ac9164]"
                        {...register("paciente.otro_anticonceptivo")}                        
                    />
                    <button className="bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]">
                        Agregar
                    </button>
                </div>
            </div>
        </details>
    </div>;
}