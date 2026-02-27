"use client";

import { useState, useEffect, useRef } from "react";
import { CiPower } from "react-icons/ci";
import { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import Recepcion from "./Recepcion";
import Boxes from "./Boxes";
import ModalConfirmacionReserva from "../modals/ModalConfirmacionReserva";
import { IBox, INuevoArribo, IPaciente } from "./types";
import { USER_ROLE } from "@/app/utils/constants";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthorization } from "@/lib/auth/useAuthorization";

export default function Panoramica() {
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<IPaciente | null>(null);
    const [boxSeleccionado, setBoxSeleccionado] = useState<IBox | null>(null);
    const [showModalConfirmacionReserva, setShowModalConfirmacionReserva] = useState(false);    
    const router = useRouter();
    const [currentLastUpdate, setCurrentLastUpdate] = useState(new Date());
    const queryClient = useQueryClient();
    const { user } = useAuthorization();
    const rol = user?.rol || 0;

    const { data: panoramica } = useQuery({
        queryKey: ["panoramica"],
        queryFn: async () => {
            const res = await fetch('/api/panoramica');
            if (!res.ok) throw new Error("Error fetching panoramica");
            const data = await res.json();
            console.log("Panoramica data fetched", data);
            return data;
        },
        enabled: !!user
    });
    
    const { data: lastUpdate } = useQuery({
        queryKey: ["lastUpdate"],
        queryFn: async () => {
            const res = await fetch('/api/panoramica/lastUpdate');
            if (!res.ok) throw new Error("Error fetching last update");
            const data = await res.json();
            return data.updatedAt ? new Date(data.updatedAt) : new Date();
        },
        enabled: !!user
    });

    useEffect(() => {
        if(currentLastUpdate && lastUpdate && lastUpdate > currentLastUpdate) {
            setCurrentLastUpdate(lastUpdate);
            queryClient.invalidateQueries({ queryKey: ["panoramica"] });
        }
    }, [lastUpdate, setCurrentLastUpdate, currentLastUpdate, queryClient]);

    const timers = useRef<Record<string, NodeJS.Timeout>>({});        
        
    const iniciarProgreso = (boxId: string) => {
        if (panoramica.boxes === null) return;
        if (timers.current[boxId]) clearInterval(timers.current[boxId]);
        const duracion = 60;
        console.log("Iniciando progreso box", boxId, "duracion", duracion);
        let progreso = 0;
        timers.current[boxId] = setInterval(() => {
            progreso += 1;            
            if (progreso >= duracion) {
                clearInterval(timers.current[boxId]);
            }
        }, 1000);
    };

    const handleSolicitarReserva = (paciente: INuevoArribo | null, box: IBox | null) => {
        console.log(rol, "Solicitando reserva para paciente", paciente, "en box", box);
        if(rol !== USER_ROLE.profesional) return;
        if(!paciente || !box) {
            toast.success(`Selecciona ahora ${paciente ? "el box" : "un paciente"} para reservar.`);
            return;
        }
        setShowModalConfirmacionReserva(true);        
    }

    // UI
    return (
        <main className="flex h-screen bg-gradient-to-br from-[#A78D60] via-[#EFC974] to-[#A48A60]">
            <Recepcion rol={rol}
                nombreProfesional={user?.nombre || ""}
                pacienteSeleccionado={pacienteSeleccionado}
                setPacienteSeleccionado={setPacienteSeleccionado}
                boxSeleccionado={boxSeleccionado}
                arribos={panoramica?.arribos || []}
                solicitarReserva={handleSolicitarReserva} />

            <Boxes role={rol}
                boxes={panoramica?.boxes || []}
                pacienteSeleccionado={pacienteSeleccionado}
                boxSeleccionado={boxSeleccionado}
                setBoxSeleccionado={setBoxSeleccionado}
                solicitarReserva={handleSolicitarReserva}/>

            {rol === USER_ROLE.profesional && 
            <ModalConfirmacionReserva show={showModalConfirmacionReserva}
                paciente={pacienteSeleccionado}
                rol={rol}
                box={boxSeleccionado}
                setBox={setBoxSeleccionado}
                iniciarProgreso={iniciarProgreso}
                onClose={() => {
                    setShowModalConfirmacionReserva(false);
                }} />}

            <button
                className="fixed bottom-2 right-2 md:bottom-6 md:right-6 z-50 bg-white shadow-lg rounded-full p-4 border border-gray-200 hover:bg-pink-100 transition flex items-center justify-center "
                title="CiPower"
                onClick={async () => {
                    router.push('/logout');
                }}>
                {/* SVG CiPower logo (placeholder) */}
                <CiPower className="text-3xl text-[#68563c]" />
            </button>
            <Toaster />
        </main>
    );
}