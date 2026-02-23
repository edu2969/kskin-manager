import { UseFormRegister } from "react-hook-form";
import { IFichaForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";

export default function Tratamiento({
    register
}: {
    register: UseFormRegister<IFichaForm>;
}) {
    const { saveField } = useAutoSaveContext();
    
    // ✅ AGREGAR función helper para auto-guardado
    const handleAutoSave = (fieldName: string, value: string) => {
        saveField(fieldName, value);
    };

    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Tratamiento</h2>
        <div>            
            <textarea
                {...register("tratamiento")}
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-40 focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                placeholder="Indicaciones para el paciente..."
                onBlur={(e) => handleAutoSave("ficha.tratamiento", e.target.value)}
            />
        </div>
    </div>;
}