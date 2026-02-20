import { Dialog, DialogTitle } from "@headlessui/react";
import { FaUserMd } from "react-icons/fa";
import { LiaTimesSolid } from "react-icons/lia";
import { IFichaDetalle } from "../types";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { useQuery } from "@tanstack/react-query";
import { AiOutlineMan, AiOutlineWoman } from "react-icons/ai";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import { useRouter } from "next/navigation";
dayjs.locale('es');
dayjs.extend(relativeTime);

export function ModalDetalleFicha({
    show, fichaId, onClose
}: {
    show: boolean;
    fichaId: string | null;
    onClose: () => void;
}) {
    const router = useRouter();
    const { data: ficha, isLoading } = useQuery<IFichaDetalle>({
        queryKey: ['fichaDetalle', fichaId],
        queryFn: async () => {
            if (!fichaId) return null;
            const res = await fetch(`/api/paciente/ficha?fichaId=${fichaId}`);
            console.log(`/api/paciente/ficha?fichaId=${fichaId}`)            
            if (!res.ok) throw new Error('Error al cargar el detalle de la ficha');            
            const data = await res.json();
            console.log("Detalle de ficha:", data);
            return data;
        },
        enabled: !!fichaId
    })

    const calcularEdad = (fechaNacimiento: Date | null) => {
        if (!fechaNacimiento) return null;
        return dayjs().diff(dayjs(fechaNacimiento), 'year');
    };    

    return (<Dialog
        open={show}
        onClose={onClose}
        className="fixed z-[60] inset-0 flex items-center justify-center"
    >
        <div className="fixed inset-0 bg-black/50" />
        <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-[95vw] max-w-5xl h-[90vh] flex flex-col">

            {/* Header del detalle */}
            <div className="bg-gradient-to-r from-[#6a3858] to-[#8e9b6d] p-6 rounded-t-2xl text-white relative">
                <button
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    onClick={onClose}
                >
                    <LiaTimesSolid size={24} />
                </button>

                {ficha && (
                    <div>
                        <DialogTitle className="text-2xl font-bold mb-2">
                            Consulta Médica - {dayjs(ficha.fecha).format('DD/MM/YYYY')}
                        </DialogTitle>
                        <div className="flex items-center gap-6 text-sm text-white/90">
                            <span className="flex items-center gap-2">
                                <FaUserMd />
                                Dr. {ficha.profesional.nombre}
                            </span>
                            {ficha.fecha && (
                                <span>
                                    Inicio: {dayjs(ficha.fecha).format('HH:mm')}                                    
                                </span>
                            )}                            
                            <span>Duración: {dayjs(ficha.finishedAt).diff(dayjs(ficha.fecha), 'minutes')} minutos</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Contenido del detalle */}
            {ficha && (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid gap-2 md:gap-6">

                        {/* Información del Paciente */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                            <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                                👤 Información del Paciente
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="flex">
                                        <p className="text-xl">{ficha.paciente.nombres} {ficha.paciente.apellidos}</p>
                                        {ficha.paciente.genero === "F" && (
                                            <AiOutlineWoman className="text-2xl text-pink-500" />
                                        )}
                                        {ficha.paciente.genero === "M" && (
                                            <AiOutlineMan className="text-2xl text-blue-500" />
                                        )}
                                        {ficha.paciente.genero === "O" && (
                                            <FaPersonCircleQuestion className="text-2xl text-neutral-500" />
                                        )}
                                    </div>                                    
                                    <p><strong>RUT:</strong> {ficha.paciente.numeroIdentidad}</p>
                                    {ficha.paciente.fechaNacimiento && (
                                        <p><strong>Edad:</strong> {calcularEdad(ficha.paciente.fechaNacimiento)} años</p>
                                    )}
                                </div>
                                <div>                                    
                                    {ficha.paciente.sistemaSalud && (
                                        <p><strong>Sistema de Salud:</strong> {ficha.paciente.sistemaSalud}</p>
                                    )}
                                </div>
                                {ficha.paciente.aplicaAlergias && (<div>
                                    <p><strong>Alergias:</strong> {ficha.paciente.alergias}</p>
                                </div>)}
                            </div>
                        </div>
                        
                        {/* Exámenes y Recetas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Exámenes */}
                            {ficha.examenes && (
                                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
                                        🔬 Exámenes Solicitados
                                    </h3>
                                    <div className="space-y-2">
                                        {ficha.examenes &&
                                            <div className="bg-white px-3 py-2 rounded-lg text-gray-700">
                                                • {ficha.examenes}
                                            </div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Antecedentes del Paciente */}
                        {(ficha.paciente.antecedentes?.length > 0) && (
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    📚 Antecedentes del Paciente
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ficha.paciente.antecedentes?.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-gray-700 mb-2">Antecedentes Mórbidos:</p>
                                            <div className="space-y-1">
                                                {ficha.paciente.antecedentes.map((ant, idx) => (
                                                    <span key={idx} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
                                                        {ant}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {ficha.paciente.medicamentos?.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-gray-700 mb-2">Medicamentos Habituales:</p>
                                            <div className="space-y-1">
                                                {ficha.paciente.medicamentos.map((med, idx) => (
                                                    <div key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mb-1">
                                                        {med.nombre}
                                                        {med.unidades && ` - ${med.unidades} unidades`}
                                                        {med.frecuencia && ` cada ${med.frecuencia}h`}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Información de Higiene */}
                        {ficha.paciente.higiene && (
                            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                                    🌿 Hábitos e Higiene
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    {ficha.paciente.higiene.cantidadCigarrillosSemanales > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="font-semibold text-red-700 flex items-center gap-2">
                                                🚬 Tabaquismo
                                            </p>
                                            <p className="text-red-600">
                                                {ficha.paciente.higiene.cantidadCigarrillosSemanales} cigarrillos por semana
                                            </p>
                                        </div>
                                    )}
                                    {ficha.paciente.higiene.aguaConsumidaDiariaLitros > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="font-semibold text-blue-700 flex items-center gap-2">
                                                💧 Hidratación
                                            </p>
                                            <p className="text-blue-600">{ficha.paciente.higiene.aguaConsumidaDiariaLitros} ml por día</p>
                                        </div>
                                    )}
                                    {ficha.paciente.higiene.horasEjerciciosSemanales > 0 && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <p className="font-semibold text-orange-700 flex items-center gap-2">
                                                🏃‍♂️ Ejercicio
                                            </p>
                                            <p className="text-orange-600">{ficha.paciente.higiene.horasEjerciciosSemanales} horas por semana</p>
                                        </div>
                                    )}
                                    {ficha.paciente.higiene.nivelEstres !== null && ficha.paciente.higiene.nivelEstres !== undefined && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                            <p className="font-semibold text-purple-700 flex items-center gap-2">
                                                Nivel de Estrés
                                            </p>
                                            <p className="text-purple-600">
                                                {ficha.paciente.higiene.nivelEstres === 'bajo' && '😌 Bajo'}
                                                {ficha.paciente.higiene.nivelEstres === 'medio' && '😐 Medio'}
                                                {ficha.paciente.higiene.nivelEstres === 'alto' && '😰 Alto'}
                                            </p>
                                        </div>
                                    )}
                                    {ficha.paciente.higiene.calidadDormir !== null && ficha.paciente.higiene.calidadDormir !== undefined && (
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                            <p className="font-semibold text-indigo-700 flex items-center gap-2">
                                                Calidad del Sueño
                                            </p>
                                            <p className="text-indigo-600">
                                                {ficha.paciente.higiene.calidadDormir === 'buena' && '😴 Bueno'}
                                                {ficha.paciente.higiene.calidadDormir === 'regular' && '😪 Regular'}
                                                {ficha.paciente.higiene.calidadDormir === 'mala' && '😵 Malo'}
                                            </p>
                                        </div>
                                    )}
                                    {ficha.paciente.higiene.habitoAlimenticio && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:col-span-2">
                                            <p className="font-semibold text-yellow-700 flex items-center gap-2 mb-2">
                                                🍎 Hábitos Alimenticios
                                            </p>
                                            <p className="text-yellow-600 whitespace-pre-wrap">{ficha.paciente.higiene.habitoAlimenticio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tabla de Partos */}
                        {ficha.paciente.partos?.length > 0 && (
                            <div className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-5 mt-6">
                                <h3 className="text-lg font-bold text-pink-800 mb-3 flex items-center gap-2">
                                    🤱 Partos
                                </h3>
                                <table className="min-w-full border text-sm rounded-lg overflow-hidden shadow">
                                    <thead>
                                        <tr className="bg-pink-100 text-pink-800">
                                            <th className="border px-3 py-2 font-semibold">#</th>
                                            <th className="border px-3 py-2 font-semibold">Fecha</th>
                                            <th className="border px-3 py-2 font-semibold">Género</th>
                                            <th className="border px-3 py-2 font-semibold">¿Abortó?</th>
                                            <th className="border px-3 py-2 font-semibold">Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ficha.paciente.partos.map((parto, idx) => (
                                            <tr key={idx} className="bg-white even:bg-pink-50">
                                                <td className="border px-3 py-2 text-center">{idx + 1}</td>
                                                <td className="border px-3 py-2">{parto.fecha ? dayjs(parto.fecha).format('DD-MM-YYYY') : '-'}</td>
                                                <td className="border px-3 py-2">{parto.genero ?? '-'}</td>                                                
                                                <td className="border px-3 py-2 font-semibold">
                                                    {parto.tipo === 'cesarea' 
                                                        ? <span className="text-red-600">Cesárea</span>
                                                        : <span className="text-green-700">Normal</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Antecedentes adicionales */}
                        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                            <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                                🩺 Antecedentes adicionales
                            </h3>
                            <div className="space-y-2">
                                {ficha.paciente?.antecedentesAdicionales &&
                                    <div className="bg-white px-3 py-2 rounded-lg text-gray-700">
                                        • <strong>Antecedentes Adicionales:</strong> {ficha.paciente.antecedentesAdicionales}
                                    </div>}
                            </div>
                        </div>

                        <div className="flex">
                            <span className="text-sm text-gray-500 mt-2"
                            onClick={() => {
                                router.push(`/modulos/ficha/${ficha.paciente.id}?fichaId=${ficha.id}`);
                            }}>
                                Editar
                            </span>
                        </div>


                    </div>
                </div>
            )}
        </div>
    </Dialog>);
}