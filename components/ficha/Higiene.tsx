import { Control, UseFormRegister, UseFormSetValue, useWatch } from "react-hook-form";
import { FaCaretSquareRight } from "react-icons/fa";
import { IFichaForm } from "./types";

export default function Higiene({ 
    register, 
    control,
    setValue
}: { 
    register: UseFormRegister<IFichaForm>,
    control: Control<IFichaForm>,
    setValue: UseFormSetValue<IFichaForm>
}) {
    const cantidadCigarrillosSemanales = useWatch({
        control,
        name: "higiene.cantidadCigarrillosSemanales"
    }) ?? 0;

    const nivelEstres = useWatch({
        control,
        name: "higiene.nivelEstres"
    }) ?? "";

    const calidadDormir = useWatch({
        control,
        name: "higiene.calidadDormir"
    }) ?? "";
    
    return <div className="bg-white rounded-lg p-4 border border-[#d5c7aa]">
        <details className="group">
            <summary className="cursor-pointer text-lg font-bold text-[#6a3858] flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">
                    <FaCaretSquareRight size="1.2rem" />
                </span>
                Higiene
            </summary>
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex items-center col-span-2">
                        <input
                            type="checkbox"
                            checked={cantidadCigarrillosSemanales > 0}
                            onChange={(e) => {
                                const nextValue = e.target.checked ? Math.max(cantidadCigarrillosSemanales, 1) : 0;
                                setValue("higiene.cantidadCigarrillosSemanales", nextValue, { shouldDirty: true });
                            }}
                            className="text-[#ac9164] w-6 h-6"
                        />
                        <label className="text-sm text-[#68563c] mx-2">Fuma</label>
                        {cantidadCigarrillosSemanales > 0 && (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    {...register("higiene.cantidadCigarrillosSemanales", { valueAsNumber: true })}
                                    className="w-16 border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                                />
                                <span className="text-xs text-[#8e9b6d]">por día</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm text-[#68563c]">Agua (cm³/día)</label>
                        <input
                            type="number"
                            min="0"
                            {...register("higiene.aguaConsumidaDiariaLitros", { valueAsNumber: true })}
                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#68563c]">Ejercicio (hrs/semana)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            {...register("higiene.horasEjercicioSemanales", { valueAsNumber: true })}
                            className="w-full border border-[#d5c7aa] rounded px-2 py-1 text-sm"
                        />
                    </div>
                    <fieldset className="border rounded-md px-4 pb-4 space-y-2 col-span-2">
                        <legend className="text-sm text-[#68563c] block">Nivel de estrés</legend>
                        <div className="flex gap-2 justify-center">
                            {['Bajo', 'Medio', 'Alto'].map((nivel, index) => {
                                const emojis = ['😊', '😐', '😰'];
                                const colors = [
                                    'bg-green-50 border-green-300 text-green-700 hover:bg-green-100',
                                    'bg-[#fad379]/20 border-[#fad379] text-[#68563c] hover:bg-[#fad379]/30',
                                    'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                ];
                                const selectedColors = [
                                    'bg-green-100 border-green-400 text-green-800 ring-2 ring-green-300',
                                    'bg-[#fad379]/40 border-[#ac9164] text-[#68563c] ring-2 ring-[#ac9164]',
                                    'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-300'
                                ];
                                const isSelected = nivelEstres === (["bajo", "medio", "alto"][index]);

                                return (
                                    <button
                                        key={nivel}
                                        type="button"
                                        onClick={() => {
                                            setValue(
                                                "higiene.nivelEstres",
                                                index === 0 ? "bajo" : index === 1 ? "medio" : "alto",
                                                { shouldDirty: true }
                                            );
                                        }}
                                        className={`flex-1 p-3 border-2 rounded-lg 
                                            transition-all ${isSelected ? selectedColors[index] : colors[index] } 
                                            ${isSelected ? "grayscale-0" : "grayscale"}`}
                                    >
                                        <div className="text-2xl mb-1">{emojis[index]}</div>
                                        <div className="text-xs font-medium">{nivel}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                    <fieldset className="border rounded-md px-4 pb-4 space-y-2 col-span-2">
                        <legend className="text-sm text-[#68563c] block">Nivel de sueño</legend>
                        <div className="flex gap-2 justify-center">
                            {['Bueno', 'Regular', 'Malo'].map((nivel, index) => {
                                const emojis = ['😴', '😪', '😵'];
                                const colors = [
                                    'bg-green-50 border-green-300 text-green-700 hover:bg-green-100',
                                    'bg-[#fad379]/20 border-[#fad379] text-[#68563c] hover:bg-[#fad379]/30',
                                    'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                ];
                                const selectedColors = [
                                    'bg-green-100 border-green-400 text-green-800 ring-2 ring-green-300',
                                    'bg-[#fad379]/40 border-[#ac9164] text-[#68563c] ring-2 ring-[#ac9164]',
                                    'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-300'
                                ];
                                const isSelected = calidadDormir === (index === 0 ? "buena" : index === 1 ? "regular" : "mala");

                                return (
                                    <button
                                        key={nivel}
                                        type="button"
                                        onClick={() => {
                                            setValue(
                                                "higiene.calidadDormir",
                                                index === 0 ? "buena" : index === 1 ? "regular" : "mala",
                                                { shouldDirty: true }
                                            );
                                        }}
                                        className={`flex-1 p-3 border-2 rounded-lg 
                                            transition-all ${isSelected ? selectedColors[index] : colors[index] } 
                                            ${isSelected ? "grayscale-0" : "grayscale"}`}
                                    >
                                        <div className="text-2xl mb-1">{emojis[index]}</div>
                                        <div className="text-xs font-medium">{nivel}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                </div>
                <div>
                    <label className="text-sm text-[#68563c]">Hábito alimenticio</label>
                    <textarea
                        className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white h-20 focus:border-[#ac9164] text-sm"
                        placeholder="Describe los hábitos alimenticios del paciente..."
                        {...register("higiene.habitoAlimenticio")}
                    />
                </div>
            </div>
        </details>
    </div>;
}