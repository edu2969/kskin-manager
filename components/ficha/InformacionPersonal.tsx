import Higiene from "./Higiene";
import Partos from "./Partos";
import Anticonceptivos from "./Anticonceptivos";
import Operaciones from "./Operaciones";
import Medicamentos from "./Medicamentos";
import { IFichaForm } from "./types";
import { UseFormRegister, UseFormSetValue, Control, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Selector } from "../uix/Selector";
import { useEffect } from "react";

export default function InformacionPersonal({
    register,
    setValue,
    control,
    esMedico,
    genero,
    onChange
}: {    
    register: UseFormRegister<IFichaForm>;
    setValue: UseFormSetValue<IFichaForm>;
    control: Control<IFichaForm>;
    esMedico: boolean;
    genero: string;
    onChange: (field: string, value: any) => void;
}) {
    const { data: sistemasSalud, isLoading } = useQuery({
        queryKey: ["sistemasSalud"],
        queryFn: async () => {
            const response = await fetch("/api/sistemasSalud");
            if (!response.ok) {
                throw new Error("Error al cargar sistemas de salud");
            }
            return response.json();
        }
    });

    // Observar el valor actual del sistema de salud en el formulario
    const sistemaSaludIdValue = useWatch({
        control,
        name: "paciente.sistemaSaludId"
    });

    // Cuando las opciones se carguen, forzar la actualización del valor si existe
    useEffect(() => {
        if (!isLoading && sistemasSalud && sistemaSaludIdValue) {
            // Forzar re-render estableciendo el valor nuevamente
            setValue("paciente.sistemaSaludId", sistemaSaludIdValue, { 
                shouldValidate: false,
                shouldDirty: false 
            });
            console.log("Sistema de salud sincronizado:", sistemaSaludIdValue);
        }
    }, [sistemasSalud, isLoading, sistemaSaludIdValue, setValue]);
    
    return <div className="space-y-2 md:space-y-4">
        <h2 className="text-xl font-bold text-[#6a3858] mb-4">Información Personal</h2>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-[#68563c] mb-1">
                    Nombres
                </label>
                <input
                    className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                    {...register("paciente.nombres")}
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-[#68563c] mb-1">
                    Apellidos
                </label>
                <input
                    className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                    {...register("paciente.apellidos")}
                />
            </div>
        </div>
        <div className="flex space-x-4">
            <div className="w-full">
                <label className="block text-xs font-semibold text-[#68563c] mb-1">
                    RUT
                </label>
                <input
                    className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                    {...register("paciente.numeroIdentidad")}
                />
            </div>

            <div className="w-1/3">
                <label className="block text-xs font-semibold text-[#68563c] mb-1">
                    Genero
                </label>
                <select
                    className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                    {...register("paciente.genero")}
                >
                    <option value="">Seleccione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                </select>
            </div>
        </div>

        <div className="w-full">
            <label className="block text-xs font-semibold text-[#68563c] mb-1">
                Dirección
            </label>
            <input
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                {...register("paciente.direccion")}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-[#68563c] mb-1">
                    Teléfono
                </label>
                <input
                    className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                    {...register("paciente.telefono")}
                />
            </div>
            <Selector label="Sistema de salud" 
                placeholder="Seleccione sistema de salud" 
                options={sistemasSalud || []}
                getLabel={(s: { id: number, nombre: string }) => s.nombre} 
                getValue={ss => ss.id}
                register={register("paciente.sistemaSaludId", { valueAsNumber: true })}
                isLoading={isLoading} />            
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Email
            </label>
            <input
                className="w-full border border-[#d5c7aa] rounded px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                {...register("paciente.email")}
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#68563c] mb-1">
                Alergias
            </label>
            <textarea
                className={`w-full border rounded px-3 py-2 bg-white h-20 focus:ring-2 focus:ring-[#fad379]/20 
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-[#d5c7aa] focus:border-[#ac9164]'
                    }`}
                {...register("paciente.alergias")}
            />
        </div>

        {!esMedico && (
            <div className="space-y-6">
                <Medicamentos onChange={onChange} register={register} setValue={setValue} />

                <Operaciones onChange={onChange} register={register} setValue={setValue} />

                {/* Métodos Anticonceptivos - Solo para mujeres */}
                {genero === 'F' && (<>
                    <Anticonceptivos 
                        register={register}
                        setValue={setValue}
                        onChange={onChange} />

                    <Partos 
                        register={register} 
                        setValue={setValue}
                        control={control}
                        onChange={onChange} />
                    </>)}                

                <Higiene register={register} control={control} setValue={setValue} />
            </div>
        )}
    </div>;
}