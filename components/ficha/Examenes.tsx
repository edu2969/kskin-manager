import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm } from "./types";
import { UseFormRegister } from "react-hook-form";
import { useAutoSaveContext } from "@/context/AutoSaveContext";

export default function Examenes({
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
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Exámenes</h2>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Escriba los exámenes a realizar
            </label>
            <textarea
                {...register("examenes")}
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164]"
                rows={7}
                placeholder="Detalle de exámenes realizados..."
                onBlur={(e) => handleAutoSave("ficha.examenes", e.target.value)}
            />
        </div>
    </div>;
}