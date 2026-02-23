import { UseFormRegister } from "react-hook-form";
import { IFichaForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";

export default function Receta({
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
        <h2 className="text-xl font-bold text-[#6a3858]">Receta</h2>
        <textarea
            className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-32 focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
            {...register("receta")}
            placeholder="Describa la receta médica, medicamentos, dosis, tiempos, otros..."
            onBlur={(e) => handleAutoSave("ficha.receta", e.target.value)}
        />        
    </div>;
}