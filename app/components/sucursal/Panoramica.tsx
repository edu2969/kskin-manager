"use client";

import { useState, useEffect, useRef } from "react";
import { CiPower } from "react-icons/ci";
import { socket } from "@/lib/socket-client";
import { useOnVisibilityChange } from '@/app/components/uix/useOnVisibilityChange';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import { signOut } from 'next-auth/react';
import ModalHistorico from "./ModalHistorico";
import Recepcion from "./Recepcion";
import Boxes from "./Boxes";
import ModalConfirmacionReserva from "./ModalConfirmacionReserva";
import { Session } from 'next-auth';
import { IBox, IPaciente, IArribo } from "./types";

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
    const timers = useRef<Record<string, NodeJS.Timeout>>({});
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            // Forzar re-render cada segundo para actualizar contadores
            setBoxes(prev => [...prev]);
        }, 1000);

        return () => clearInterval(interval);
    }, []);


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
        socket.on("update-centrointegral", (data: any) => {
            console.log(">>>> Update centrointegral", data, session);
            fetchVistaPanoramica();
        });

        return () => {
            socket.off("update-centrointegral");
        };
    }, [session, fetchVistaPanoramica]);

    useEffect(() => {
        if (session?.user?.role) setRole(session.user.role);
    }, [session]);

    useEffect(() => {
        setRole(session?.user?.role || -1);
        // Verifica si hay sesión y el socket está conectado
        if (session?.user?.id && socket.connected) {
            console.log("Re-uniendo a room-centrointegral después de posible recarga");
            socket.emit("join-room", {
                room: "room-centrointegral",
                userId: session.user.id
            });
        }

        // Evento para manejar reconexiones del socket
        const handleReconnect = () => {
            if (session?.user?.id) {
                console.log("Socket reconectado, uniendo a sala nuevamente");
                socket.emit("join-room", {
                    room: "room-centrointegral",
                    userId: session.user.id
                });
            }
        };

        // Escucha el evento de reconexión
        socket.on("connect", handleReconnect);

        return () => {
            socket.off("connect", handleReconnect);
        };
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

    const onCloseModalNuevoPaciente = () => {
        setPacienteSeleccionado(null);
        setBoxSeleccionado(null);
    }   

    const nombreProfesional = (email: string) => {
        if (!email) return "";
        const nombre = email.split("@")[0];
        return nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }

    
        
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

    // UI
    return (
        <main className="flex h-screen bg-gradient-to-br from-[#A78D60] via-[#EFC974] to-[#A48A60]">
            <Recepcion role={role} 
                nombreProfesional={nombreProfesional(session?.user?.email || "")}
                arribos={arribos}
                setArribo={setArriboSeleccionado}
                onClose={onCloseModalNuevoPaciente}/>

            <Boxes boxes={boxes} 
                paciente={pacienteSeleccionado} 
                setBoxes={setBoxes} 
                iniciarProgreso={iniciarProgreso} />

            <ModalConfirmacionReserva show={showModalConfirmacionReserva}
                paciente={pacienteSeleccionado}
                role={role}
                box={boxSeleccionado}
                setBox={setBoxSeleccionado} 
                iniciarProgreso={iniciarProgreso}               
                onClose={() => {
                    setShowModalConfirmacionReserva(false);                    
                    fetchVistaPanoramica();
                }}/>

            <button
                className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-full p-4 border border-gray-200 hover:bg-pink-100 transition flex items-center justify-center"
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