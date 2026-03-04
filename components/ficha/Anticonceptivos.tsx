import { useQuery } from "@tanstack/react-query";
import { UseFormRegister, useFieldArray, Control } from "react-hook-form";
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
            metodoAnticonceptivoId: 0,
            fechaDesde: "",
            fechaHasta: "",
            nombreMetodo: ""
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
        if (field.id && field.id !== undefined && !String(field.id).startsWith('new_')) {
            console.log("Enviando comando de eliminación para:", field.id); // Debug
            handleAutoSave(`paciente.anticonceptivo.delete.${field.id}`, 'true');
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
                                <tr key={field.id}>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        <input 
                                            type="hidden" 
                                            {...register(`metodosAnticonceptivos.${index}.anticonceptivoId`)}
                                        />
                                        <select
                                            {...register(`metodosAnticonceptivos.${index}.metodoAnticonceptivoId`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const selectedMethod = metodosAnticonceptivos?.find((m: { id: number; }) => m.id === parseInt(selectedId));
                                                handleAutoSave(`paciente.anticonceptivo.${field.anticonceptivoId}.metodo_anticonceptivo_id`, selectedId);
                                                // También guardar el nombre para mostrar
                                                if (selectedMethod) {
                                                    // Actualizar el campo nombreMetodo en el formulario
                                                    register(`metodosAnticonceptivos.${index}.nombreMetodo`).onChange({
                                                        target: { value: selectedMethod.nombre }
                                                    });
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
                                        <input 
                                            type="hidden" 
                                            {...register(`metodosAnticonceptivos.${index}.nombreMetodo`)}
                                        />
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        <input
                                            type="date"
                                            {...register(`metodosAnticonceptivos.${index}.fechaDesde`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                            onBlur={(e) => handleAutoSave(`paciente.anticonceptivo.${field.anticonceptivoId}.fecha_desde`, e.target.value)}
                                        />
                                    </td>
                                    <td className="border border-[#d5c7aa] p-2 text-sm">
                                        <input
                                            type="date"
                                            {...register(`metodosAnticonceptivos.${index}.fechaHasta`)}
                                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
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
                
                {/* Campo de texto para otros métodos */}
                <div className="mt-4">
                    <label className="block text-sm text-[#68563c] mb-2">Otro método anticonceptivo:</label>
                    <input
                        type="text"
                        placeholder="Especificar otro método anticonceptivo..."
                        className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white text-sm focus:border-[#ac9164]"
                        {...register("paciente.otroAnticonceptivo")}  
                        onBlur={(e) => saveField("paciente.otro_anticonceptivo", e.target.value)}
                    />
                </div>
            </div>
        </details>
    </div>;
}