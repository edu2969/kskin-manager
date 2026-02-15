import RutInput from '@/components/uix/RutInput';
import { Dialog, DialogTitle } from '@headlessui/react';
import { useState } from 'react';
import { AiOutlineMan, AiOutlineWoman } from 'react-icons/ai';
import { FaPersonCircleQuestion } from 'react-icons/fa6';
import { IoMdClose } from 'react-icons/io';
import { LuSearch } from "react-icons/lu";
import Loader from '../Loader';
import { IPaciente } from '../sucursal/types';

export default function ModalRegistroPaciente({
    show, registrarArribo, onClose
} : {
    show: boolean;
    registrarArribo: (paciente: IPaciente) => Promise<void>;
    onClose: () => void;
}) {
    const [searching, setSearching] = useState(false);
    const [rutBusqueda, setRutBusqueda] = useState("");
    const [pacienteEncontrado, setPacienteEncontrado] = useState<IPaciente | null>(null);    

    const handleBuscarPaciente = async () => {
        if (!rutBusqueda.trim()) return;
        setSearching(true);
        const response = await fetch(`/api/recepcion/pacientePorRut?rut=${encodeURIComponent(rutBusqueda)}`);
        const data = await response.json();
        if (data.ok && data.paciente) {
            console.log("Paciente encontrado:", data.paciente);
            setPacienteEncontrado(data.paciente);
        } else {
            setPacienteEncontrado(null);
        }
        setSearching(false);
    }
        
    return (<Dialog open={show} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" />
        <div className="relative bg-[#f6eedb] rounded-xl shadow-xl p-8 z-10 border border-[#d5c7aa] w-[96%] max-w-md">
            <button
                className="absolute top-2 right-2 text-[#8e9b6d] hover:text-[#68563c] transition-colors"
                onClick={() => {
                    setPacienteEncontrado(null);
                    onClose();
                }}
            >
                <IoMdClose size={22} />
            </button>
            <DialogTitle className="font-bold text-lg mb-4 text-[#6a3858]">Registrar paciente</DialogTitle>
            <div className="w-full mb-4">
                <label className="block text-sm font-semibold text-[#68563c] mb-1">RUT del paciente</label>
                <div className="flex gap-2">
                    <div className="w-52">
                        <RutInput
                            value={rutBusqueda}
                            onChange={setRutBusqueda}
                            className="w-48"
                            placeholder="Ej: 12.345.678-9"
                        />
                    </div>
                    <button
                        className="rounded bg-[#66754c] hover:bg-[#8e9b6d] text-white h-12 w-12 flex flex-col items-center justify-center shadow transition"
                        onClick={handleBuscarPaciente}
                        type="button"
                        title="Buscar"
                    >
                        {!searching ? (
                            <LuSearch size="2.4rem" />
                        ) : (<div className="w-full text-center ml-2 pl-0.5"><Loader texto="" /></div>)}
                    </button>
                </div>
            </div>
            {pacienteEncontrado && (
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
                                    : (pacienteEncontrado.nombres + " " + pacienteEncontrado.apellidos)}
                            </div>
                            <div className="text-xs text-[#8e9b6d]">{pacienteEncontrado.rut}</div>
                        </div>
                    </div>
                    {pacienteEncontrado.nuevo && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-[#68563c] mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                    value={pacienteEncontrado.nombres}
                                    onChange={e =>
                                        setPacienteEncontrado(prev => prev ? ({
                                            ...prev,
                                            nombres: e.target.value,
                                        }) : null)
                                    }
                                    placeholder="Nombre completo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#68563c] mb-1">Género</label>
                                <select
                                    className="w-full rounded border border-[#d5c7aa] px-3 py-2 bg-white focus:border-[#ac9164] focus:ring-2 focus:ring-[#fad379]/20"
                                    value={pacienteEncontrado.genero}
                                    onChange={e =>
                                        setPacienteEncontrado(prev => prev ? ({
                                            ...prev,
                                            genero: e.target.value,
                                        }) : null)
                                    }
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
                                    checked={!!pacienteEncontrado.tratoEspecial}
                                    onChange={e =>
                                        setPacienteEncontrado(prev => prev ? ({
                                            ...prev,
                                            tratoEspecial: e.target.checked,
                                            nombreSocial: e.target.checked ? (prev.nombreSocial || "") : ""
                                        }) : null)
                                    }
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
                                        value={pacienteEncontrado.nombreSocial || ""}
                                        onChange={e =>
                                            setPacienteEncontrado(prev => prev ? ({
                                                ...prev,
                                                nombreSocial: e.target.value,
                                            }) : null)
                                        }
                                        placeholder="Nombre social"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            <div className="flex gap-2 mt-6 h-12">
                <button
                    className="flex-1 rounded-full bg-[#66754c] hover:bg-[#8e9b6d] text-white font-semibold py-2 transition disabled:opacity-50 shadow"
                    disabled={!pacienteEncontrado || !pacienteEncontrado.nombres || !pacienteEncontrado.genero}
                    onClick={() => {
                        if(pacienteEncontrado) {
                            registrarArribo(pacienteEncontrado);
                        }
                        onClose();
                    }}
                >Aceptar
                </button>
                <button
                    className="flex-1 rounded-full bg-[#d5c7aa] hover:bg-[#ac9164] text-[#68563c] hover:text-white font-semibold py-2 transition shadow"
                    onClick={() => {                        
                        setRutBusqueda("");
                        setPacienteEncontrado(null);
                        onClose();
                    }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    </Dialog>);
}