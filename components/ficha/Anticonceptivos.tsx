import { useQuery } from "@tanstack/react-query";
import { UseFormRegister, useFieldArray, Control } from "react-hook-form";
import { FaRegTrashCan } from "react-icons/fa6";
import { IFichaForm, IAnticonceptivoForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";
import { FaCaretSquareRight } from "react-icons/fa";
import AutocompleteInput from "../prefabs/AutocompleteInput";

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

    const handleAgregarAnticonceptivo = (selectedItem: { key: string | number; value: string }) => {
        const nuevoAnticonceptivoId = `new_${Date.now()}`;
        const nuevoAnticonceptivo: IAnticonceptivoForm = {
            anticonceptivoId: nuevoAnticonceptivoId,
            pacienteId: undefined,
            metodoAnticonceptivoId: Number(selectedItem.key)
        };
        
        // Verificar que no esté ya agregado
        const yaExiste = fields.some(field => field.metodoAnticonceptivoId === Number(selectedItem.key));
        if (!yaExiste) {
            append(nuevoAnticonceptivo);
            // Auto-save al agregar
            handleAutoSave(`paciente.anticonceptivo.${nuevoAnticonceptivoId}.metodo_anticonceptivo_id`, String(selectedItem.key));
        }
    };

    const handleAutoSave = (fieldName: string, value: string) => {
        console.log('🔍 Auto-save anticonceptivos llamado con:', { fieldName, value });
        saveField(fieldName, value);
    };

    const handleRemoverAnticonceptivo = (index: number) => {
        const field = fields[index];
        console.log("Removiendo anticonceptivo:", index, "Field:", field);
        
        // Si el anticonceptivo tiene un ID real, eliminar de la base de datos
        if (field.anticonceptivoId && !String(field.anticonceptivoId).startsWith('new_')) {
            console.log("Enviando comando de eliminación para:", field.anticonceptivoId);
            handleAutoSave(`paciente.anticonceptivo.delete.${field.anticonceptivoId}`, 'true');
        }
        
        // Remover del formulario
        remove(index);
    };

    // Preparar datos para el autocomplete
    const autocompleteItems = metodosAnticonceptivos?.map((metodo: { id: number; nombre: string }) => ({
        key: metodo.id,
        value: metodo.nombre
    })) || [];

    // Obtener nombres de métodos seleccionados para mostrar
    const getMetodoNombre = (metodoId: number) => {
        const metodo = metodosAnticonceptivos?.find((m: { id: number }) => m.id === metodoId);
        return metodo?.nombre || `Método ID: ${metodoId}`;
    };

    return <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
            <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">
                    <FaCaretSquareRight size="1.2rem" />
                </span>
                Métodos Anticonceptivos
            </summary>
            <div className="mt-4 space-y-4">
                {/* Autocomplete Input */}
                <AutocompleteInput
                    items={autocompleteItems}
                    onSelect={handleAgregarAnticonceptivo}
                    placeholder="Buscar y seleccionar método anticonceptivo..."
                />
                
                {/* Métodos seleccionados como calugas */}
                {fields.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {fields.map((field, index) => (
                            <div 
                                key={field.anticonceptivoId || field.id || index}
                                className="inline-flex items-center bg-[#f6eedb] text-[#68563c] px-3 py-1 rounded-full border border-[#d5c7aa] text-sm"
                            >
                                <input 
                                    type="hidden" 
                                    {...register(`metodosAnticonceptivos.${index}.anticonceptivoId`)}
                                    value={field.anticonceptivoId || ""}
                                />
                                <input 
                                    type="hidden" 
                                    {...register(`metodosAnticonceptivos.${index}.metodoAnticonceptivoId`)}
                                    value={field.metodoAnticonceptivoId || ""}
                                />
                                <span className="mr-2">
                                    {getMetodoNombre(field.metodoAnticonceptivoId)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoverAnticonceptivo(index)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
                                    title="Eliminar método anticonceptivo"
                                >
                                    <FaRegTrashCan size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </details>
    </div>;
}