import { Dialog, DialogTitle } from '@headlessui/react';
import { useState, useMemo, useEffect } from 'react';
import { AiOutlineMan, AiOutlineWoman } from 'react-icons/ai';
import { FaPersonCircleQuestion } from 'react-icons/fa6';
import { IoMdClose } from 'react-icons/io';
import { INuevoArribo, IPaciente } from '../sucursal/types';
import { useForm } from 'react-hook-form';
import { AutocompleteClientSearchInput } from '../prefabs/AutomcompleteClientSearchInput';
import { useQuery } from '@tanstack/react-query';
import Loader from '../Loader';

export default function ModalRegistroPaciente({
    show, registrarArribo, onClose
}: {
    show: boolean;
    registrarArribo: (paciente: INuevoArribo) => Promise<void>;
    onClose: () => void;
}) {
    const [rutBusqueda, setRutBusqueda] = useState("");
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{ id: string, nombre: string, rut: string } | null>(null);
    const { register, setValue, handleSubmit, watch } = useForm<INuevoArribo>({
        defaultValues: {
            numeroIdentidad: "",
            nombreCompleto: '',
            genero: '',
            tratoEspecial: false,
            nombreSocial: ''
        }
    });

    const { data: pacienteEncontrado, isLoading } = useQuery<IPaciente>({
        queryKey: ["paciente-encontrado", pacienteSeleccionado?.id],
        queryFn: async () => {
            const res = await fetch(`/api/paciente/byId/${pacienteSeleccionado?.id}`);
            if (!res.ok) throw new Error("Error fetching paciente details");
            const data = await res.json();
            return data.paciente;
        },
        enabled: !!pacienteSeleccionado
    });
    
    useEffect(() => {
        console.log("Paciente seleccionado", pacienteSeleccionado);
        console.log("paciente encontrado", pacienteEncontrado);
    }, [pacienteSeleccionado, pacienteEncontrado]);

    const onSubmit = async (formData: INuevoArribo) => {
        console.log("Formulario enviado con datos:", formData, pacienteEncontrado);
        if (!pacienteEncontrado) return;
        registrarArribo({
            id: pacienteEncontrado.id || null,
            numeroIdentidad: rutBusqueda,
            nombreCompleto: formData.nombreCompleto || "",
            genero: formData.genero || pacienteEncontrado.genero,
            tratoEspecial: pacienteEncontrado.tratoEspecial || false,
            nombreSocial: formData.nombreSocial || pacienteEncontrado.nombreSocial || ""
        });
        onClose();
    }

    const nombreCompleto = watch("nombreCompleto");
    const genero = watch("genero");

    // Validación inteligente del botón
    const isFormValid = useMemo(() => {
        // Si no hay paciente encontrado, el botón debe estar deshabilitado
        if (!pacienteEncontrado) return false;

        // Si es un paciente existente (no nuevo), siempre es válido
        if (!pacienteEncontrado.nuevo) return true;

        // Si es un paciente nuevo, validar campos requeridos
        return (
            (nombreCompleto || "").trim().length > 0 &&
            (genero || "").trim().length > 0
        );
    }, [pacienteEncontrado, nombreCompleto, genero]);

    return (<Dialog open={show} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" />
        <form onSubmit={handleSubmit(onSubmit)} className="relative bg-[#f6eedb] rounded-xl shadow-xl p-8 z-10 border border-[#d5c7aa] w-[96%] max-w-md">
            <button
                className="absolute top-2 right-2 text-[#8e9b6d] hover:text-[#68563c] transition-colors"
                onClick={() => {
                    setPacienteSeleccionado(null);
                    onClose();
                }}
            >
                <IoMdClose size={22} />
            </button>
            <DialogTitle className="font-bold text-lg mb-4 text-[#6a3858]">Registrar paciente</DialogTitle>
            <div className="w-full mb-4">
                <label className="block text-sm font-semibold text-[#68563c] mb-1">Nombre/RUT del paciente</label>
                <div className="flex gap-2">
                    <div className="w-full">
                        <AutocompleteClientSearchInput
                            className="w-full"
                            placeholder="12.987.654-3 / Nombre"
                            onSelected={(paciente) => {
                                console.log(
                                    "Paciente seleccionado:",
                                    paciente
                                );
                                setRutBusqueda(paciente.rut);
                                setPacienteSeleccionado({
                                    id: paciente.id,
                                    nombre: paciente.nombre,
                                    rut: paciente.rut
                                });
                                setValue(
                                    "numeroIdentidad",
                                    paciente.rut
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
            {!isLoading && pacienteEncontrado && (
                <div className="mb-4 p-4 rounded-lg bg-[#fad379]/20 border border-[#fad379] flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        {pacienteEncontrado.genero == "F" ? (
                            <AiOutlineWoman className="text-2xl text-pink-500" />
                        ) : pacienteEncontrado.genero == "M" ? (
                            <AiOutlineMan className="text-2xl text-blue-500" />
                        ) : (
                            <FaPersonCircleQuestion className="text-2xl text-[#8e9b6d]" />
                        )}
                        <div>
                            <div className="font-semibold text-[#68563c]">
                                {pacienteEncontrado.nuevo
                                    ? "Nuevo paciente"
                                    : (pacienteEncontrado.nombreSocial || pacienteEncontrado.nombres + " " + pacienteEncontrado.apellidos)}
                            </div>
                            <div className="text-xs text-[#8e9b6d]">{pacienteEncontrado.numeroIdentidad}</div>
                        </div>
                    </div>
                    {pacienteEncontrado.nuevo && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-[#68563c] mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                    {...register("nombreCompleto", { required: true })}
                                    placeholder="Nombre completo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#68563c] mb-1">Género</label>
                                <select
                                    className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                    {...register("genero", { required: true })}
                                >
                                    <option value="">Selecciona...</option>
                                    <option value="F">Femenino</option>
                                    <option value="M">Masculino</option>
                                    <option value="O">Otro</option>
                                </select>
                            </div>
                            <div className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    id="tratoEspecial"
                                    {...register("tratoEspecial")}
                                    checked={!!pacienteEncontrado.tratoEspecial}
                                    className="mr-2 accent-[#66754c]"
                                />
                                <label htmlFor="tratoEspecial" className="text-sm font-semibold text-[#68563c]">Trato especial</label>
                            </div>
                            {pacienteEncontrado.tratoEspecial && (
                                <div className="mt-2">
                                    <label className="block text-sm font-semibold text-[#68563c] mb-1">Nombre social</label>
                                    <input
                                        type="text"
                                        className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                        {...register("nombreSocial")}
                                        placeholder="Nombre social"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            {isLoading && (
                <div className="mb-4 p-4 rounded-lg bg-[#fad379]/20 border border-[#fad379] flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Loader texto="Identificando paciente..." />
                    </div>
                </div>
            )}
            <div className="flex gap-2 mt-6 h-12">
                <button
                    className="flex-1 rounded-full bg-[#66754c] hover:bg-[#8e9b6d] text-white font-semibold py-2 transition disabled:opacity-50 shadow"
                    disabled={!isFormValid}
                    type="submit"
                >Aceptar
                </button>
                <button
                    className="flex-1 rounded-full bg-[#d5c7aa] hover:bg-[#ac9164] text-[#68563c] hover:text-white font-semibold py-2 transition shadow"
                    onClick={() => {
                        setRutBusqueda("");
                        setPacienteSeleccionado(null);
                        onClose();
                    }}
                >
                    Cancelar
                </button>
            </div>
        </form>
    </Dialog>);
}