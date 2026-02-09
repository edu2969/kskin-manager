"use client";

import { useState, useEffect, useRef } from "react";
import { CiPower } from "react-icons/ci";
import { useOnVisibilityChange } from '@/app/components/uix/useOnVisibilityChange';
import { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import { signOut } from 'next-auth/react';
import Recepcion from "./Recepcion";
import Boxes from "./Boxes";
import ModalConfirmacionReserva from "../modals/ModalConfirmacionReserva";
import { Session } from 'next-auth';
import { IBox, IPaciente, IArribo } from "./types";
import { USER_ROLE } from "@/app/utils/constants";
import toast from "react-hot-toast";

export default function Panoramica({ session }: { session: Session }) {
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<IPaciente | null>(null);
    const [arriboSeleccionado, setArriboSeleccionado] = useState<IArribo | null>(null);
    const [boxSeleccionado, setBoxSeleccionado] = useState<IBox | null>(null);

    const [showModalConfirmacionReserva, setShowModalConfirmacionReserva] = useState(false);
    const [loading, setLoading] = useState(false);
    const [arribos, setArribos] = useState<IArribo[]>([]);
    const [boxes, setBoxes] = useState<IBox[]>([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const [role, setRole] = useState(session?.user?.role || "??");
    const router = useRouter();

    const fetchVistaPanoramica = async () => {
        setLoading(true);
        const response = await fetch('/api/panoramica');
        const data = await response.json();
        setArribos(data.arribos || []);
        setBoxes(data.boxes || []);
        console.log("ARRIBOS", data.arribos);
        console.log("BOXES", data.boxes);
        setLoading(false);
    };
   
    useEffect(() => {
        if (session?.user?.role) setRole(session.user.role);
    }, [session]);    

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchVistaPanoramica(),
                ]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
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
                b._id === boxId
                    ? { ...b, progreso: 0 }
                    : b
            )
        );
        let duracion = boxes.find((b) => b._id === boxId)?.ocupacion?.tiempoEstimado || 60;
        console.log("Iniciando progreso box", boxId, "duracion", duracion);
        let progreso = 0;
        timers.current[boxId] = setInterval(() => {
            progreso += 1;
            setBoxes((prev) =>
                prev.map((b) =>
                    b._id === boxId
                        ? { ...b, progreso: progreso / duracion }
                        : b
                )
            );
            if (progreso >= duracion) {
                clearInterval(timers.current[boxId]);
                setBoxes((prev) =>
                    prev.map((b) =>
                        b._id === boxId
                            ? { ...b, ocupado: false, paciente: null, progreso: 0 }
                            : b
                    )
                );
            }
        }, 1000);
    };

    const handleSolicitarReserva = (paciente: IPaciente | null, box: IBox | null) => {
        console.log(role, "Solicitando reserva para paciente", paciente, "en box", box);
        if(role !== USER_ROLE.profesional) return;
        if(!paciente || !box) {
            toast.success(`Selecciona ahora ${paciente ? "el box" : "un paciente"} para reservar.`);
            return;
        }
        setShowModalConfirmacionReserva(true);        
    }

    // UI
    return (
        <main className="flex h-screen bg-gradient-to-br from-[#A78D60] via-[#EFC974] to-[#A48A60]">
            <Recepcion role={role}
                nombreProfesional={nombreProfesional(session?.user?.email || "")}
                pacienteSeleccionado={pacienteSeleccionado}
                setPacienteSeleccionado={setPacienteSeleccionado}
                boxSeleccionado={boxSeleccionado}
                arribos={arribos}
                solicitarReserva={handleSolicitarReserva} />

            <Boxes role={role}
                boxes={boxes}
                pacienteSeleccionado={pacienteSeleccionado}
                boxSeleccionado={boxSeleccionado}
                setBoxSeleccionado={setBoxSeleccionado}
                solicitarReserva={handleSolicitarReserva}/>

            {role === USER_ROLE.profesional && 
            <ModalConfirmacionReserva show={showModalConfirmacionReserva}
                paciente={pacienteSeleccionado}
                role={role}
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
                    signOut({ redirect: false }).then(() => {
                        router.push('/logout');
                    });
                }}>
                {/* SVG CiPower logo (placeholder) */}
                <CiPower className="text-3xl text-[#68563c]" />
            </button>
            <Toaster />
        </main>
    );
}