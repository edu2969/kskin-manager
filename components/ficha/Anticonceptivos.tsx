import { useQuery } from "@tanstack/react-query";
import { UseFormRegister, useFieldArray, Control, useWatch } from "react-hook-form";
import { FaRegTrashCan } from "react-icons/fa6";
import { IFichaForm, IAnticonceptivoForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";
import { FaCaretSquareRight } from "react-icons/fa";

export default function Anticonceptivos({ 
    register,
    control
}: {     
    register: UseFormRegister<IFichaForm>;
    control: Control<IFichaForm>;
}) { 
    const { saveField } = useAutoSaveContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "metodosAnticonceptivos"
    });

    // Observar los valores del formulario para forzar re-render cuando cambien los datos
    const watchedValues = useWatch({
        control,
        name: "metodosAnticonceptivos"
    });

    const { data: metodosAnticonceptivos } = useQuery({
        queryKey: ["metodosAnticonceptivos"],
        queryFn: async () => {
            const response = await fetch("/api/anticonceptivos");
            const data = await response.json();
            return data;
        }
    });

    const handleAgregarAnticonceptivo = () => {
        const nuevoAnticonceptivoId = `new_${Date.now()}`; // ID único basado en timestamp
        const nuevoAnticonceptivo: IAnticonceptivoForm = {
            anticonceptivoId: nuevoAnticonceptivoId,
            pacienteId: undefined, // Se agregará en el backend para nuevos anticonceptivos
            metodoAnticonceptivoId: -1, // Valor temporal para indicar "no seleccionado"
            fechaDesde: "",
            fechaHasta: ""
        };
        append(nuevoAnticonceptivo);
    };

    const handleAutoSave = (fieldName: string, value: string) => {
        console.log('🔍 Auto-save anticonceptivos llamado con:', { fieldName, value });
        const match = fieldName.match(/paciente\.anticonceptivo\.([^\.]+)\./);
        console.log('🤷‍♂️ ID extraído del fieldName:', match ? match[1] : 'NO MATCH');
        saveField(fieldName, value);
    };

    const handleRemoverAnticonceptivo = (index: number) => {
        const field = fields[index];
        console.log("Removiendo anticonceptivo:", index, "Field:", field); // Debug
        // Si el anticonceptivo tiene un ID real, eliminar de la base de datos
        if (field.anticonceptivoId && field.anticonceptivoId !== undefined && !String(field.anticonceptivoId).startsWith('new_')) {
            console.log("Enviando comando de eliminación para:", field.anticonceptivoId); // Debug
            handleAutoSave(`paciente.anticonceptivo.delete.${field.anticonceptivoId}`, 'true');
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
                Métodos Anticonceptivos
            </summary>
            <div className="mt-4">
                <button
                    type="button"
                    onClick={handleAgregarAnticonceptivo}
                    className="mb-4 bg-[#66754c] text-white px-3 py-2 rounded text-sm hover:bg-[#8e9b6d]"
                >
                    Agregar Método Anticonceptivo
                </button>
                
                {fields.length > 0 && (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#d5c7aa]">
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Método</th>
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Fecha Inicio</th>
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Fecha Fin</th>
                                <th className="border border-[#ac9164] p-2 text-left text-sm">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.map((field, index) => (
                                <tr key={`_metodo_anticonceptivo_${index}`}>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        <input 
                                            type="hidden" 
                                            {...register(`metodosAnticonceptivos.${index}.anticonceptivoId`)}
                                        />
                                        <select
                                            {...register(`metodosAnticonceptivos.${index}.metodoAnticonceptivoId`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            value={watchedValues?.[index]?.metodoAnticonceptivoId || ""}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                if (selectedId && selectedId !== "0") {
                                                    handleAutoSave(`paciente.anticonceptivo.${field.anticonceptivoId}.metodo_anticonceptivo_id`, selectedId);
                                                }
                                            }}
                                        >
                                            <option value="">Seleccionar método</option>
                                            {metodosAnticonceptivos && metodosAnticonceptivos.map((metodo: { id: number; nombre: string; }) => (
                                                <option key={metodo.id} value={metodo.id}>
                                                    {metodo.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        <input
                                            type="date"
                                            {...register(`metodosAnticonceptivos.${index}.fechaDesde`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            value={watchedValues?.[index]?.fechaDesde || ""}
                                            onBlur={(e) => handleAutoSave(`paciente.anticonceptivo.${field.anticonceptivoId}.fecha_desde`, e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        <input
                                            type="date"
                                            {...register(`metodosAnticonceptivos.${index}.fechaHasta`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            value={watchedValues?.[index]?.fechaHasta || ""}
                                            onBlur={(e) => handleAutoSave(`paciente.anticonceptivo.${field.anticonceptivoId}.fecha_hasta`, e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoverAnticonceptivo(index)}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                            title="Eliminar método anticonceptivo"
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