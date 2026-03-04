import { UseFormRegister, useFieldArray, Control } from "react-hook-form";
import { IFichaForm, IPartoForm } from "./types";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaCaretSquareRight } from "react-icons/fa";
import { useAutoSaveContext } from "@/context/AutoSaveContext";

export default function Partos({ 
    register,
    control
}: { 
    register: UseFormRegister<IFichaForm>;
    control: Control<IFichaForm>;
}) {
    const { saveField } = useAutoSaveContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "partos"
    });
    
    const handleAgregarParto = () => {
        const nuevoPartoId = `new_${Date.now()}`; // ID único basado en timestamp
        const nuevoParto: IPartoForm = {
            partoId: nuevoPartoId,
            pacienteId: undefined, // Se agregará en el backend para nuevos partos
            fecha: "",
            genero: "",
            tipo: ""
        };
        append(nuevoParto);
    };

    const handleAutoSave = (fieldName: string, value: string) => {
        console.log('🔍 Auto-save llamado con:', { fieldName, value });
        const match = fieldName.match(/paciente\.parto\.([^\.]+)\./);
        console.log('🤷‍♂️ ID extraído del fieldName:', match ? match[1] : 'NO MATCH');
        saveField(fieldName, value);
    };

    const handleRemoverParto = (index: number) => {
        const field = fields[index];
        console.log("Removiendo parto:", index, "Field:", field); // Debug
        // Si el parto tiene un ID real, eliminar de la base de datos
        if (field.id && field.id !== undefined && !String(field.id).startsWith('new_')) {
            console.log("Enviando comando de eliminación para:", field.id); // Debug
            handleAutoSave(`paciente.parto.delete.${field.id}`, 'true');
        }
        // Remover del formulario
        remove(index);
    };

    return <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
            <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">
                    <FaCaretSquareRight size="1.2rem" />
                </span>
                Partos
            </summary>
            <div className="mt-4">
                <button
                    type="button"
                    onClick={handleAgregarParto}
                    className="mb-4 bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]"
                >
                    Agregar Parto
                </button>
                {fields.length > 0 && (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#d5c7aa]">
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Número</th>
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Fecha</th>
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Género</th>
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Tipo</th>
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields
                                .map((field, index) => ({ field, index }))
                                .sort((a, b) => {
                                    const fechaA = a.field.fecha || '';
                                    const fechaB = b.field.fecha || '';
                                    return fechaA.localeCompare(fechaB);
                                })
                                .map(({ field, index }, sortedIndex) => (
                                <tr key={sortedIndex}>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        {sortedIndex + 1}.
                                        <input 
                                            type="hidden" 
                                            {...register(`partos.${sortedIndex}.partoId`)}
                                        />
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        <input
                                            type="date"
                                            {...register(`partos.${index}.fecha`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            onBlur={(e) => handleAutoSave(`paciente.parto.${field.partoId}.fecha`, e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2">
                                        <select
                                            {...register(`partos.${index}.genero`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            onChange={(e) => handleAutoSave(`paciente.parto.${field.partoId}.genero`, e.target.value)}
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="V">Varón</option>
                                            <option value="N">Niña</option>
                                            <option value="X">No sabe</option>
                                        </select>
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2">
                                        <select
                                            {...register(`partos.${index}.tipo`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            onChange={(e) => handleAutoSave(`paciente.parto.${field.partoId}.tipo`, e.target.value)}
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="normal">Normal</option>
                                            <option value="cesarea">Cesárea</option>
                                            <option value="aborto">Aborto</option>
                                        </select>
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoverParto(index)}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                            title="Eliminar parto"
                                        >
                                            <FaRegTrashCan size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </details>
    </div>;
}