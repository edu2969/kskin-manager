import { Dialog, DialogTitle } from '@headlessui/react';
import { useState, useMemo, useEffect } from 'react';
import { AiOutlineMan, AiOutlineWoman } from 'react-icons/ai';
import { FaPersonCircleQuestion } from 'react-icons/fa6';
import { IoMdClose } from 'react-icons/io';
import { FaUserPlus } from "react-icons/fa";
import { INuevoArribo, IPaciente } from '../sucursal/types';
import { useForm } from 'react-hook-form';
import { AutocompleteClientSearchInput } from '../prefabs/AutomcompleteClientSearchInput';
import { useQuery } from '@tanstack/react-query';
import Loader from '../Loader';
import RutInput from '../prefabs/RutInput';
import { isValidRutFormat } from '@/app/utils/rutFormatter';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ModalRegistroPaciente({
    show, registrarArribo, onClose
}: {
    show: boolean;
    registrarArribo: (paciente: INuevoArribo) => Promise<void>;
    onClose: () => void;
}) {
    const [rutBusqueda, setRutBusqueda] = useState("");
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{ id: string, nombre: string, rut: string } | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [rutError, setRutError] = useState<string | null>(null);
    const [showPostCreateDialog, setShowPostCreateDialog] = useState(false);
    const [postCreatePacienteId, setPostCreatePacienteId] = useState<string | null>(null);
    const router = useRouter();
    const { register, setValue, handleSubmit, watch, reset } = useForm<INuevoArribo>({
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
            // Si es un paciente nuevo creado con el botón "Nuevo"
            if (pacienteSeleccionado?.id === "nuevo") {
                return {
                    id: null,
                    numeroIdentidad: "",
                    nombres: "",
                    apellidos: "",
                    genero: "",
                    nuevo: true,
                    tratoEspecial: false,
                    nombreSocial: ""
                } as unknown as IPaciente;
            }
            
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

        // Paciente existente: registrar arribo directamente
        if (pacienteEncontrado && !pacienteEncontrado.nuevo) {
            registrarArribo({
                id: pacienteEncontrado.id || null,
                numeroIdentidad: formData.numeroIdentidad,
                nombreCompleto: formData.nombreCompleto || "",
                genero: formData.genero || pacienteEncontrado.genero,
                tratoEspecial: pacienteEncontrado.tratoEspecial || false,
                nombreSocial: formData.nombreSocial || pacienteEncontrado.nombreSocial || ""
            });
            reset();
            setRutBusqueda("");
            setPacienteSeleccionado(null);
            onClose();
            return;
        }

        // Paciente nuevo: crear vía API
        if (!pacienteEncontrado || !pacienteEncontrado.nuevo) return;

        // Validar RUT antes de enviar
        const rutLimpio = (formData.numeroIdentidad || "").replace(/[.\-]/g, "");
        if (!isValidRutFormat(formData.numeroIdentidad || "")) {
            setRutError("El RUT no es válido");
            toast.error("El RUT ingresado no es válido");
            return;
        }

        setIsCreating(true);
        setRutError(null);

        let createdPacienteId: string | null = null;

        try {
            const res = await fetch("/api/paciente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombres: formData.nombreCompleto?.split(" ")[0] || "",
                    apellidos: formData.nombreCompleto?.split(" ").slice(1).join(" ") || "",
                    numeroIdentidad: rutLimpio,
                    genero: formData.genero,
                    nombreSocial: formData.nombreSocial || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al crear paciente");
            }

            toast.success("Paciente creado exitosamente");

            const createdPacienteId = data.paciente?.id || null;

            // Registrar arribo con el paciente recién creado
            await registrarArribo({
                id: createdPacienteId,
                numeroIdentidad: formData.numeroIdentidad,
                nombreCompleto: formData.nombreCompleto || "",
                genero: formData.genero || "",
                tratoEspecial: false,
                nombreSocial: formData.nombreSocial || "",
            });

            reset();
            setRutBusqueda("");
            setPacienteSeleccionado(null);
        } catch (error) {
            console.error("Error creando paciente:", error);
            toast.error(error instanceof Error ? error.message : "Error al crear paciente");
        } finally {
            setIsCreating(false);
            setRutBusqueda("");
            // Paso 6: mostrar opción post-crear
            if (createdPacienteId) {
                setPostCreatePacienteId(createdPacienteId);
                setShowPostCreateDialog(true);
            } else {
                onClose();
            }
        }
    }

    const nombreCompleto = watch("nombreCompleto");
    const genero = watch("genero");
    const numeroIdentidad = watch("numeroIdentidad");

    // Validación en tiempo real del RUT para pacientes nuevos
    useEffect(() => {
        if (!pacienteEncontrado?.nuevo) {
            setRutError(null);
            return;
        }
        const rut = numeroIdentidad || "";
        if (rut.length === 0) {
            setRutError(null);
            return;
        }
        if (!isValidRutFormat(rut)) {
            setRutError("El RUT no es válido");
        } else {
            setRutError(null);
        }
    }, [numeroIdentidad, pacienteEncontrado]);

    // Validación inteligente del botón
    const isFormValid = useMemo(() => {
        // Si no hay paciente encontrado, el botón debe estar deshabilitado
        if (!pacienteEncontrado) return false;

        // Si es un paciente existente (no nuevo), siempre es válido
        if (!pacienteEncontrado.nuevo) return true;

        // Si es un paciente nuevo, validar campos requeridos y RUT válido
        return (
            rutError === null &&
            (numeroIdentidad || "").trim().length > 0 &&
            (nombreCompleto || "").trim().length > 0 &&
            (genero || "").trim().length > 0
        );
    }, [pacienteEncontrado, numeroIdentidad, nombreCompleto, genero, rutError]);

    return (<Dialog open={show} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="fixed inset-0 bg-black/30" />
        <form onSubmit={handleSubmit(onSubmit)} className="relative bg-[#f6eedb] rounded-xl shadow-xl p-8 z-10 border border-[#d5c7aa] w-full max-w-md">
            <button
                className="absolute top-2 right-2 text-[#8e9b6d] hover:text-[#68563c] transition-colors"
                onClick={() => {
                    reset();
                    setRutBusqueda("");
                    setPacienteSeleccionado(null);
                    onClose();
                }}
                aria-label="Cerrar modal"
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
                            onCreateNew={(rut) => {
                                setRutBusqueda(rut);
                                setValue("numeroIdentidad", rut);
                                setPacienteSeleccionado({
                                    id: "nuevo",
                                    nombre: "",
                                    rut: rut,
                                });
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
                                <label className="block text-sm font-semibold text-[#68563c] mb-1">RUT *</label>
                                <RutInput
                                    value={numeroIdentidad}
                                    onChange={(value: string) => setValue("numeroIdentidad", value)}
                                    placeholder="Ej: 12.345.678-9"
                                    className={`w-full rounded border px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20 ${rutError ? "border-red-500 focus:ring-red-500" : "border-[#d5c7aa] focus:border-[#ac9164] focus:ring-[#fad379]/20"}`}
                                />
                                {rutError && (
                                    <p className="text-xs text-red-600 mt-1" role="alert">{rutError}</p>
                                )}
                            </div>
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
            <div className="flex flex-col sm:flex-row gap-2 mt-6 h-12">
                <button
                    className="flex-1 rounded-full bg-[#66754c] hover:bg-[#8e9b6d] text-white font-semibold py-2 transition disabled:opacity-50 shadow"
                    disabled={!isFormValid || isCreating}
                    type="submit"
                >
                    {isCreating ? "Creando..." : pacienteEncontrado?.nuevo ? "CREAR" : "Aceptar"}
                </button>
                <button
                    className="flex-1 rounded-full bg-[#d5c7aa] hover:bg-[#ac9164] text-[#68563c] hover:text-white font-semibold py-2 transition shadow"
                    onClick={() => {
                        reset();
                        setRutBusqueda("");
                        setPacienteSeleccionado(null);
                        onClose();
                    }}
                >
                    Cancelar
                </button>
            </div>

            {/* Paso 6: Diálogo post-crear */}
            <Dialog open={showPostCreateDialog} onClose={() => setShowPostCreateDialog(false)} className="fixed z-50 inset-0 flex items-center justify-center p-4 sm:p-6">
                <div className="fixed inset-0 bg-black/40" />
                <div className="relative bg-[#f6eedb] rounded-xl shadow-xl p-8 z-10 border border-[#d5c7aa] w-full max-w-md">
                    <DialogTitle className="font-bold text-lg mb-4 text-[#6a3858]">Paciente creado</DialogTitle>
                    <p className="mb-6 text-[#68563c]">¿Qué deseas hacer ahora?</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => {
                                setShowPostCreateDialog(false);
                                onClose();
                            }}
                            className="flex-1 rounded-full bg-[#d5c7aa] hover:bg-[#ac9164] text-[#68563c] font-semibold py-2 transition shadow"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={() => {
                                setShowPostCreateDialog(false);
                                onClose();
                                router.push(`/modulos/ficha?pacienteId=${postCreatePacienteId}`);
                            }}
                            className="flex-1 rounded-full bg-[#66754c] hover:bg-[#8e9b6d] text-white font-semibold py-2 transition shadow"
                        >
                            Abrir ficha
                        </button>
                    </div>
                </div>
            </Dialog>
        </form>
    </Dialog>);
}