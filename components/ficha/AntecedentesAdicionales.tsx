import { UseFormRegister } from "react-hook-form";
import { IFichaForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";

export function AntecedentesAdicionales({
    register
}: {
    register: UseFormRegister<IFichaForm>;
}) {
    const { saveField } = useAutoSaveContext();
    
    const handleAutoSave = (fieldName: string, value: string | number) => {
        saveField(fieldName, value);
    };

    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Antecedentes Adicionales</h2>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Descripción de antecedentes
            </label>
            <textarea
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                {...register("paciente.antecedentesAdicionales")}
                placeholder="Describa los antecedentes adicionales relevantes..."
                rows={7}
                onBlur={(e) => handleAutoSave("paciente.antecedentes_adicionales", e.target.value)}
            />
        </div>
    </div>;
}