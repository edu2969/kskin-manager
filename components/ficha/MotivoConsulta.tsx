import { UseFormRegister } from "react-hook-form";
import { IFichaForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";

export default function MotivoConsulta({
    register
}: {
    register: UseFormRegister<IFichaForm>;
}) {
    const { saveField } = useAutoSaveContext();
    
    const handleAutoSave = (fieldName: string, value: string | number) => {
        saveField(fieldName, value);
    };

    return <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Motivo de Consulta</h2>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Descripción del motivo
            </label>
            <textarea
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                {...register("motivoConsulta")}
                placeholder="Describa el motivo principal de la consulta..."
                rows={7}
                onBlur={(e) => handleAutoSave("ficha.motivo_consulta", e.target.value)}
            />
        </div>
    </div>;
}