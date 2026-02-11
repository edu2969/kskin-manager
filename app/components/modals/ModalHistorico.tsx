import { useState } from "react";
import HistoricoFichas from "../HistoricoFichas"
import { IoMdClose } from "react-icons/io";
import { Dialog, DialogTitle } from "@headlessui/react";
import RutInput from "../uix/RutInput";
import Loader from "../Loader";
import { IPaciente } from "../sucursal/types";
import toast from "react-hot-toast";
import { LuSearch } from "react-icons/lu";

export default function ModalHistorico({
    show, setShow, onClose    
}: {
    show: string | boolean;
    setShow: React.Dispatch<React.SetStateAction<string | boolean>>;
    onClose: () => void;
}) {
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [historico, setHistorico] = useState([]);
    const [rutBusqueda, setRutBusqueda] = useState("");    
    const [paciente, setPaciente] = useState<IPaciente | null>(null);
    const [searching, setSearching] = useState(false);

    const fetchHistorico = async (paciente: IPaciente | null) => {
        setLoadingHistorico(true);
        if (!paciente?._id) return;
        try {
            const resp = await fetch(`/api/paciente/historico?pacienteId=${paciente._id}`);
            if (resp.ok) {
                const data = await resp.json();
                console.log("Histórico completo cargado:", data);
                setHistorico(data.historico);
            } else {
                toast.error("Error al cargar el histórico de fichas.");
            }
        } catch {
            toast.error("Error de red al cargar el histórico.");
        }
        setLoadingHistorico(false);
    };
    
    return (<Dialog open={show !== false} onClose={() => onClose()} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" />
        <div className="relative bg-white rounded-xl shadow-xl p-8 z-10 w-[400px] max-h-[90vh] overflow-y-auto">
            <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                onClick={() => onClose()}
            >
                <IoMdClose size={22} />
            </button>
            {show === 'buscar' ? (
                <>
                    <DialogTitle className="font-bold text-lg mb-4 text-pink-400">Buscar paciente por RUT</DialogTitle>
                    <div className="mb-4">
                        <RutInput
                            value={rutBusqueda}
                            onChange={setRutBusqueda}
                            className="w-full rounded border border-pink-300 px-3 py-2 text-lg bg-white focus:border-pink-400 focus:ring-2 focus:ring-pink-200/20"
                            placeholder="Ej: 12.345.678-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex-1 rounded bg-pink-200 hover:bg-pink-300 text-pink-800 font-semibold py-2 transition"
                            onClick={async () => {
                                if (!rutBusqueda.trim()) return toast.error("Ingresa un RUT válido");
                                setSearching(true);
                                try {
                                    const resp = await fetch(`/api/recepcion/pacientePorRut?rut=${rutBusqueda}`);
                                    if (resp.ok) {
                                        const data = await resp.json();
                                        if (data.paciente) {
                                            setPaciente(data.paciente);
                                            await fetchHistorico(data.paciente);
                                            setShow('historico');
                                        } else {
                                            toast.error("Paciente no encontrado");
                                        }
                                    } else {
                                        toast.error("Error al buscar paciente");
                                    }
                                } catch {
                                    toast.error("Error de red al buscar paciente");
                                }
                                setSearching(false);
                            }}
                            type="button"
                            title="Buscar"
                            disabled={searching}
                        >
                            {!searching ? (
                                <div className="flex justify-center items-center gap-2"><LuSearch size="1.8rem" /> Buscar paciente</div>
                            ) : (<Loader texto="" />)}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <DialogTitle className="font-bold text-lg mb-4 text-pink-400">Histórico de paciente</DialogTitle>
                    <div>
                        <HistoricoFichas
                            isOpen={show === 'historico'}
                            onClose={onClose}
                            historico={historico}
                            loading={loadingHistorico}
                            pacienteNombre={paciente?.nombres + ' ' + paciente?.apellidos}
                        />
                    </div>
                </>
            )}
        </div>
    </Dialog>);
}