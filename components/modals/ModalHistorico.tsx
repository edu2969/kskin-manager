import { useEffect, useState } from "react";
import HistoricoFichas from "../HistoricoFichas"
import { IoMdClose } from "react-icons/io";
import { Dialog, DialogTitle } from "@headlessui/react";
import { IPaciente } from "../sucursal/types";
import { AutocompleteClientSearchInput } from "../prefabs/AutomcompleteClientSearchInput";
import { useQuery } from "@tanstack/react-query";

export default function ModalHistorico({
    show, setShow, onClose    
}: {
    show: string | boolean;
    setShow: React.Dispatch<React.SetStateAction<string | boolean>>;
    onClose: () => void;
}) {
    const [pacienteId, setPacienteId] = useState<string | null>(null);

    const { data:paciente, isLoading: isLoadingPaciente } = useQuery<IPaciente>({
        queryKey: ['pacienteById', pacienteId],
        queryFn: async () => {
            if (!pacienteId) return null;
            const resp = await fetch(`/api/paciente/byId/${pacienteId}`);
            if (resp.ok) {
                const data = await resp.json();
                console.log("DATA", data);
                return data.paciente || null;
            }
            throw new Error("Error al cargar el paciente.");
        },
        enabled: !!pacienteId
    });

    useEffect(() => {
        if(pacienteId !== null) {
            setShow('historico');
        }
    }, [pacienteId]);
        
        
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
                        <AutocompleteClientSearchInput
                        className=""
                        onSelected={(paciente) => {
                            setPacienteId(paciente.id);
                        }}
                            placeholder="Buscar paciente por RUT"
                        />
                    </div>                    
                </>
            ) : <HistoricoFichas
                    isOpen={show === 'historico'}
                    onClose={onClose}
                    paciente={paciente || null}
                    isLoading={isLoadingPaciente}
                />}           
        </div>
    </Dialog>);
}