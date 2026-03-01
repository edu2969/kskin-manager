"use client"

import { useState } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { LiaTimesSolid } from "react-icons/lia";
import { FaCalendarAlt, FaClipboardList } from "react-icons/fa";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
dayjs.locale('es');
dayjs.extend(relativeTime);

import { IFichaHistorica } from "./types";
import { IPaciente } from "./sucursal/types";
import Image from "next/image";
import { ModalDetalleFicha } from "./modals/ModalDetalleFicha";
import { useQuery } from "@tanstack/react-query";

export default function HistoricoFichas({
    isOpen,
    onClose,
    paciente
}: {
    isOpen: boolean;
    onClose: () => void;
    paciente: IPaciente | null;
}) {
    const [fichaSeleccionada, setFichaSeleccionada] = useState<string | null>(null);
    const [modalDetalle, setModalDetalle] = useState(false);

    const { data: historico, isLoading: loadingHistorico } = useQuery<IFichaHistorica[]>({
        queryKey: ['historicoFichas', paciente?.id],
        queryFn: async () => {
            if (!paciente?.id) return [];
            const resp = await fetch(`/api/paciente/historico?pacienteId=${paciente.id}`);
            if (resp.ok) {
                const data = await resp.json();
                console.log("Histórico completo cargado:", data);
                return data.historico || [];
            } else {
                throw new Error("Error al cargar el histórico de fichas.");
            }
        },
        enabled: isOpen && !!paciente?.id
    });

    const handleVerDetalle = (fichaId: string) => {
        setFichaSeleccionada(fichaId);
        setModalDetalle(true);
    };

    return (
        <>
            {/* Modal principal del histórico */}
            <Dialog
                open={isOpen}
                onClose={onClose}
                className="fixed z-50 inset-0 flex items-center justify-center"
            >
                <div className="fixed inset-0 bg-black/40" />
                <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-[95vw] max-w-6xl h-[85vh] flex flex-col">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#6a3858] to-[#8e9b6d] p-6 rounded-t-2xl text-white relative">
                        <button
                            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                            onClick={onClose}
                        >
                            <LiaTimesSolid size={24} />
                        </button>

                        <div className="flex items-center gap-3">
                            <FaClipboardList size={28} />
                            <div>
                                <DialogTitle className="text-2xl font-bold">
                                    Histórico Médico
                                </DialogTitle>
                                <p className="text-white/90 text-sm mt-1">
                                    {paciente?.nombres} {paciente?.apellidos} • {historico?.length} consulta{historico?.length !== 1 ? 's' : ''} registrada{historico?.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 overflow-hidden">
                        {loadingHistorico ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a3858] mx-auto mb-4"></div>
                                    <p className="text-gray-600">Cargando histórico médico...</p>
                                </div>
                            </div>
                        ) : historico?.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-gray-500">
                                    <FaClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-xl font-medium mb-2">Sin registros médicos anteriores</p>
                                    <p className="text-sm">No hay consultas médicas previas registradas para este paciente.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 md:p-6 overflow-y-auto h-full">
                                <div className="grid gap-2">
                                    {historico && historico.map((ficha) => (
                                        <div
                                            key={ficha.fichaId}
                                            className="bg-gradient-to-r from-[#f6eedb] to-[#fad379]/20 border border-[#d5c7aa] rounded-lg py-1 md:p-3 hover:shadow-md transition-all cursor-pointer"
                                            onClick={() => handleVerDetalle(ficha.fichaId)}
                                        >
                                            <div className="md:flex md:items-center md:justify-between px-2 md:px-4 pb-1">
                                                {/* Info principal */}
                                                <div className="md:flex-1 flex items-start md:items-center md:gap-6">                                                    

                                                    {/* Profesional */}
                                                    <div className="flex flex-col md:flex-none md:items-center gap-2 text-[#68563c] min-w-[200px]">
                                                        <div className="flex">
                                                            <div className="flex flex-col justify-center items-center">
                                                                <Image src={`/profesionales/${ficha.alias}.png`} alt="Foto profesional" 
                                                                    width={72} height={72} className="rounded-full object-cover border-2 border-[#ac9164]" />
                                                            </div>
                                                            <div className="ml-3 font-semibold text-lg">
                                                                {ficha.nombreProfesional} 
                                                                <div className="flex flex-wrap font-medium text-sm">
                                                                {ficha.especialidades?.length > 0 && ficha.especialidades.map((especialidad, idx) => (
                                                                    <div key={idx} className="flex text-left pr-1">
                                                                        <p className="text-xs bg-[#ac9164] text-white px-2 py-0.5 rounded-full mb-1">
                                                                            {String(especialidad)}
                                                                        </p>
                                                                    </div>))}
                                                            </div>                                                            
                                                        </div>
                                                        </div>                                                        
                                                    </div>

                                                    <div className="w-1/2 flex flex-col justify-between gap-2">
                                                        {/* Fecha */}
                                                        <div className="flex justify-end items-start gap-1 text-[#ac9164]">
                                                            <FaCalendarAlt size={18} className="mt-1" />
                                                            <span className="font-semibold">
                                                                {dayjs(ficha.fecha).format('DD/MM/YYYY')}
                                                            </span>
                                                        </div>
                                                        {/* Anamnesis */}
                                                        {ficha.anamnesis ? (<p className="line-clamp-3 text-xs text-gray-400">
                                                            <strong>Anamnesis:</strong> {ficha.anamnesis}
                                                        </p>) : (<p className="line-clamp-3 text-xs text-gray-400">
                                                            <strong>Tratamiento:</strong> {ficha.tratamiento}
                                                        </p>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Dialog>

            <ModalDetalleFicha show={modalDetalle} 
                fichaId={fichaSeleccionada} 
                onClose={() => setModalDetalle(false)} />
        </>
    );
}