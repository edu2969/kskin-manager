import { UseFormRegister } from "react-hook-form";
import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";

export default function Medicamentos({
    register
}: {
    register: UseFormRegister<IFichaForm>;
}) {
    const { saveField } = useAutoSaveContext();
    
    // ✅ AGREGAR función helper para auto-guardado
    const handleAutoSave = (fieldName: string, value: string) => {
        saveField(fieldName, value);
    };

    return <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
            <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">
                    <FaCaretSquareRight size="1.2rem" />
                </span>
                Medicamentos
            </summary>
            <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            {...register("paciente.medicamentos")}
                            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164]"
                            onBlur={(e) => handleAutoSave("paciente.medicamentos", e.target.value)}
                            placeholder="Nombre del medicamento"
                        />
                    </div>
                </div>
            </div>
        </details>
    </div>;
}