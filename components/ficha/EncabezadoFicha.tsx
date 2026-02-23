import { IPaciente } from "../sucursal/types";
import { useState } from "react";
import HistoricoFichas from "../HistoricoFichas";

export default function EncabezadoFicha({
    paciente,
    profesional
}: {
    paciente: IPaciente
    profesional: {
        id: string;
        nombre: string;
        email: string;
        especialidades: string[];
    } | null
}) {
    const [showHistorico, setShowHistorico] = useState(false);

    return <div className="mb-1 md:mb-4">
        <div className="bg-[#f6eedb] rounded-lg p-4 shadow border border-[#d5c7aa]">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#ac9164] flex items-center justify-center text-2xl font-bold text-white">
                    {paciente
                        ? paciente.nombres?.[0]?.toUpperCase() +
                        (paciente.apellidos?.[0]?.toUpperCase() || "")
                        : ""}
                </div>
                <div className="flex-1">
                    <div className="font-bold text-lg text-[#68563c]">
                        {paciente
                            ? `${(paciente.nombres + " " + paciente.apellidos) || ""}`
                            : "Cargando..."}
                    </div>
                    <div className="text-sm text-[#66754c]">
                        {paciente?.numeroIdentidad}
                        {paciente?.fechaNacimiento
                            ? ` • ${new Date(
                                paciente.fechaNacimiento
                            ).toLocaleDateString()}`
                            : ""}
                    </div>
                    <div className="text-xs text-[#8e9b6d]">
                        {paciente?.email}
                    </div>
                </div>
                <div className="text-xs text-[#8e9b6d]">
                    Profesional:{" "}
                    <p className="font-semibold text-[#6a3858] text-md">
                        {profesional?.nombre || "No asignado"}
                    </p>
                </div>
            </div>

            {/* Histórico */}
            <button
                className="mt-3 pt-3 border-t border-[#d5c7aa] w-full text-left"
                onClick={() => setShowHistorico(true)}
            >
                <div className="text-xs text-[#8e9b6d] hover:text-[#68563c] transition-colors cursor-pointer">
                    📋 Ver histórico de fichas
                </div>
            </button>
        </div>
            
        <HistoricoFichas
            paciente={paciente || null}
            isOpen={showHistorico}
            onClose={() => setShowHistorico(false)}
        />
    </div>;
}