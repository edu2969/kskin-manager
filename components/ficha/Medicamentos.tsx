import { useQuery } from "@tanstack/react-query";
import { Control, UseFormRegister, useFieldArray } from "react-hook-form";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm, IMedicamentoForm } from "./types";
import { useAutoSaveContext } from "@/context/AutoSaveContext";
import AutocompleteInput from "../prefabs/AutocompleteInput";

export default function Medicamentos({
    register,
    control
}: {
    register: UseFormRegister<IFichaForm>;
    control: Control<IFichaForm>;
}) {
    const { saveField } = useAutoSaveContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "medicamentos"
    });

    const { data: medicamentos } = useQuery({
        queryKey: ["medicamentos"],
        queryFn: async () => {
            const response = await fetch("/api/medicamentos");
            const data = await response.json();
            return data?.medicamentos || [];
        }
    });

    const handleAutoSave = (fieldName: string, value: string) => {
        saveField(fieldName, value);
    };

    const handleAgregarMedicamento = (selectedItem: { key: string | number; value: string }) => {
        const medicamentoId = String(selectedItem.key);
        const yaExiste = fields.some((field) => String(field.medicamentoId) === medicamentoId);

        if (yaExiste) {
            return;
        }

        const relacionId = `new_${Date.now()}`;
        const nuevoMedicamento: IMedicamentoForm = {
            relacionId,
            medicamentoId
        };

        append(nuevoMedicamento);
        handleAutoSave(`ficha.medicamento.${relacionId}.medicamento_id`, medicamentoId);
    };

    const handleRemoverMedicamento = (index: number) => {
        const field = fields[index];
        if (field?.medicamentoId) {
            handleAutoSave(`ficha.medicamento.delete.${field.medicamentoId}`, "true");
        }
        remove(index);
    };

    const autocompleteItems = (medicamentos || []).map((medicamento: { id: string; nombre: string }) => ({
        key: medicamento.id,
        value: medicamento.nombre
    }));

    const getMedicamentoNombre = (medicamentoId: string) => {
        const medicamento = (medicamentos || []).find((item: { id: string }) => item.id === medicamentoId);
        return medicamento?.nombre || `Medicamento ID: ${medicamentoId}`;
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
                <AutocompleteInput
                    items={autocompleteItems}
                    onSelect={handleAgregarMedicamento}
                    placeholder="Buscar y seleccionar medicamento..."
                />

                {fields.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {fields.map((field, index) => (
                            <div
                                key={field.relacionId || field.id || index}
                                className="inline-flex items-center bg-[#f6eedb] text-[#68563c] px-3 py-1 rounded-full border border-[#d5c7aa] text-sm"
                            >
                                <input
                                    type="hidden"
                                    {...register(`medicamentos.${index}.relacionId`)}
                                    value={field.relacionId || ""}
                                />
                                <input
                                    type="hidden"
                                    {...register(`medicamentos.${index}.medicamentoId`)}
                                    value={field.medicamentoId || ""}
                                />
                                <span className="mr-2">{getMedicamentoNombre(String(field.medicamentoId || ""))}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoverMedicamento(index)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
                                    title="Eliminar medicamento"
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