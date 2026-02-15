"use client";

import { useState, useEffect, useRef } from "react";
import { CiPower } from "react-icons/ci";
import { useOnVisibilityChange } from '@/components/uix/useOnVisibilityChange';
import { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import Recepcion from "./Recepcion";
import Boxes from "./Boxes";
import ModalConfirmacionReserva from "../modals/ModalConfirmacionReserva";
import { IBox, IPaciente, IArribo } from "./types";
import { USER_ROLE } from "@/app/utils/constants";
import toast from "react-hot-toast";
import { useAuthorization } from "@/lib/auth/useAuthorization";

export default function Panoramica() {
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<IPaciente | null>(null);
    const [boxSeleccionado, setBoxSeleccionado] = useState<IBox | null>(null);

    const [showModalConfirmacionReserva, setShowModalConfirmacionReserva] = useState(false);
    const [arribos, setArribos] = useState<IArribo[]>([]);
    const [boxes, setBoxes] = useState<IBox[]>([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const [rol, setRol] = useState(0);
    const auth = useAuthorization();
    const router = useRouter();

    const fetchVistaPanoramica = async () => {
        const response = await fetch('/api/panoramica');
        const data = await response.json();
        setArribos(data.arribos || []);
        setBoxes(data.boxes || []);
        console.log("ARRIBOS", data.arribos);
        console.log("BOXES", data.boxes);
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                await Promise.all([
                    fetchVistaPanoramica(),
                ]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } 
        };
        fetchAll();
        console.log("--------------------> USER CONTEXT EN PANORAMICA", auth.user);
        setRol(auth.user?.rol || 0);
    }, []);

    useOnVisibilityChange(async () => {
        await fetch('/api/panoramica/lastUpdate')
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.updatedAt) {
                    const updatedAt = new Date(data.updatedAt);
                    if (updatedAt > lastUpdate) {
                        setLastUpdate(updatedAt);
                        fetchVistaPanoramica();
                    }
                }
            })
            .catch(() => { });
    });

    const nombreProfesional = (email: string) => {
        if (!email) return "";
        const nombre = email.split("@")[0];
        return nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }

    const timers = useRef<Record<string, NodeJS.Timeout>>({});        
        
    const iniciarProgreso = (boxId: string) => {
        if (boxes === null) return;
        if (timers.current[boxId]) clearInterval(timers.current[boxId]);
        setBoxes((prev) =>
            prev.map((b) =>
                b.id === boxId
                    ? { ...b, progreso: 0 }
                    : b
            )
        );
        const duracion = 60;
        console.log("Iniciando progreso box", boxId, "duracion", duracion);
        let progreso = 0;
        timers.current[boxId] = setInterval(() => {
            progreso += 1;
            setBoxes((prev) =>
                prev.map((b) =>
                    b.id === boxId
                        ? { ...b, progreso: progreso / duracion }
                        : b
                )
            );
            if (progreso >= duracion) {
                clearInterval(timers.current[boxId]);
                setBoxes((prev) =>
                    prev.map((b) =>
                        b.id === boxId
                            ? { ...b, ocupado: false, paciente: null, progreso: 0 }
                            : b
                    )
                );
            }
        }, 1000);
    };

    const handleSolicitarReserva = (paciente: IPaciente | null, box: IBox | null) => {
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
                nombreProfesional={nombreProfesional("None")}
                pacienteSeleccionado={pacienteSeleccionado}
                setPacienteSeleccionado={setPacienteSeleccionado}
                boxSeleccionado={boxSeleccionado}
                arribos={arribos}
                solicitarReserva={handleSolicitarReserva} />

            <Boxes role={rol}
                boxes={boxes}
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
                    setPacienteSeleccionado(null);
                    setBoxSeleccionado(null);
                    setShowModalConfirmacionReserva(false);
                    fetchVistaPanoramica();
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