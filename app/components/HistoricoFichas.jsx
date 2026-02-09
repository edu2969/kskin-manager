"use client"

import { useState } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { LiaTimesSolid } from "react-icons/lia";
import { FaCalendarAlt, FaUserMd, FaStethoscope, FaPrescriptionBottleAlt, FaClipboardList, FaHeartbeat } from "react-icons/fa";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.locale('es');
dayjs.extend(relativeTime);

export default function HistoricoFichas({
    isOpen,
    onClose,
    historico = [],
    loading = false,
    pacienteNombre = ""
}) {
    const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
    const [modalDetalle, setModalDetalle] = useState(false);

    const handleVerDetalle = (ficha) => {
        setFichaSeleccionada(ficha);
        setModalDetalle(true);
    };

    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return null;
        return dayjs().diff(dayjs(fechaNacimiento), 'year');
    };

    const formatearSignosVitales = (signos) => {
        const vitales = [];
        if (signos.presionArterial) vitales.push(`PA: ${signos.presionArterial}`);
        if (signos.frecuenciaCardiaca) vitales.push(`FC: ${signos.frecuenciaCardiaca} lpm`);
        if (signos.temperatura) vitales.push(`T°: ${signos.temperatura}°C`);
        if (signos.peso) vitales.push(`Peso: ${signos.peso} kg`);
        if (signos.talla) vitales.push(`Talla: ${signos.talla} cm`);
        if (signos.imc) vitales.push(`IMC: ${signos.imc}`);
        return vitales;
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
                                    {pacienteNombre} • {historico.length} consulta{historico.length !== 1 ? 's' : ''} registrada{historico.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a3858] mx-auto mb-4"></div>
                                    <p className="text-gray-600">Cargando histórico médico...</p>
                                </div>
                            </div>
                        ) : historico.length === 0 ? (
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
                                    {historico.map((ficha, index) => (
                                        <div
                                            key={ficha._id}
                                            className="bg-gradient-to-r from-[#f6eedb] to-[#fad379]/20 border border-[#d5c7aa] rounded-lg md:p-3 hover:shadow-md transition-all cursor-pointer"
                                            onClick={() => handleVerDetalle(ficha)}
                                        >
                                            <div className="md:flex md:items-center md:justify-between px-2 md:px-4 pb-1">
                                                {/* Info principal */}
                                                <div className="md:flex-1 flex items-start md:items-center md:gap-6">
                                                    {/* Fecha */}
                                                    <div className="flex items-center gap-2 text-[#6a3858] min-w-[140px]">
                                                        <FaCalendarAlt size={14}/>
                                                        <span className="font-semibold">
                                                            {dayjs(ficha.fecha).format('DD/MM/YYYY')}
                                                        </span>
                                                    </div>

                                                    {/* Profesional */}
                                                    <div className="flex flex-col md:flex-none md:items-center gap-2 text-[#68563c] min-w-[200px]">
                                                        <div className="flex space-x-3">
                                                            <FaUserMd size={14} className="mt-4"/>
                                                            <div className="font-medium text-sm max-w-32">
                                                                {ficha.profesional.nombre}
                                                                {ficha.profesional.especialidades?.length > 0 && (<div className="w-full text-right pr-6">
                                                                    <span className="text-xs bg-[#ac9164] text-white px-2 py-0.5 rounded-full">
                                                                        {ficha.profesional.especialidades[0]}
                                                                    </span>
                                                                </div>)}
                                                            </div>
                                                        </div>                                                                                                                
                                                    </div>

                                                    {/* Diagnóstico truncado */}
                                                    <div className="flex-1 text-sm text-gray-600">
                                                        {ficha.consulta.diagnostico ? (
                                                            <span>
                                                                <strong>Diagnóstico:</strong> {ficha.consulta.diagnostico.substring(0, 60)}{ficha.consulta.diagnostico.length > 60 ? '...' : ''}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Sin diagnóstico registrado</span>
                                                        )}
                                                    </div>

                                                    {/* Signos vitales e indicadores */}
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        {ficha.consulta.signosVitales && formatearSignosVitales(ficha.consulta.signosVitales).length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <FaHeartbeat className="text-red-500" size={12} />
                                                                <span>{formatearSignosVitales(ficha.consulta.signosVitales).length} signos</span>
                                                            </div>
                                                        )}
                                                        {ficha.consulta.solicitudExamenes?.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <FaStethoscope size={12} />
                                                                {ficha.consulta.solicitudExamenes.length} ex.
                                                            </span>
                                                        )}
                                                        {ficha.consulta.recetas?.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <FaPrescriptionBottleAlt size={12} />
                                                                {ficha.consulta.recetas.length} rec.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Botón Ver Detalle */}
                                                <button className="bg-[#6a3858] text-white px-3 py-1.5 rounded-md hover:bg-[#8e4b72] transition-colors font-medium text-sm">
                                                    Ver Detalle
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Dialog>

            {/* Modal de detalle de ficha */}
            <Dialog
                open={modalDetalle}
                onClose={() => setModalDetalle(false)}
                className="fixed z-[60] inset-0 flex items-center justify-center"
            >
                <div className="fixed inset-0 bg-black/50" />
                <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-[95vw] max-w-5xl h-[90vh] flex flex-col">

                    {/* Header del detalle */}
                    <div className="bg-gradient-to-r from-[#6a3858] to-[#8e9b6d] p-6 rounded-t-2xl text-white relative">
                        <button
                            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                            onClick={() => setModalDetalle(false)}
                        >
                            <LiaTimesSolid size={24} />
                        </button>

                        {fichaSeleccionada && (
                            <div>
                                <DialogTitle className="text-2xl font-bold mb-2">
                                    Consulta Médica - {dayjs(fichaSeleccionada.fecha).format('DD/MM/YYYY')}
                                </DialogTitle>
                                <div className="flex items-center gap-6 text-sm text-white/90">
                                    <span className="flex items-center gap-2">
                                        <FaUserMd />
                                        Dr. {fichaSeleccionada.profesional.nombre}
                                    </span>
                                    {fichaSeleccionada.consulta.horaInicio && (
                                        <span>
                                            {dayjs(fichaSeleccionada.consulta.horaInicio).format('HH:mm')}
                                            {fichaSeleccionada.consulta.horaFin && (
                                                ` - ${dayjs(fichaSeleccionada.consulta.horaFin).format('HH:mm')}`
                                            )}
                                        </span>
                                    )}
                                    {fichaSeleccionada.consulta.duracionMinutos && (
                                        <span>Duración: {fichaSeleccionada.consulta.duracionMinutos} min</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contenido del detalle */}
                    {fichaSeleccionada && (
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid gap-6">

                                {/* Información del Paciente */}
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        👤 Información del Paciente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p><strong>Nombre:</strong> {fichaSeleccionada.paciente.nombres} {fichaSeleccionada.paciente.apellidos}</p>
                                            <p><strong>RUT:</strong> {fichaSeleccionada.paciente.rut}</p>
                                            {fichaSeleccionada.paciente.fechaNacimiento && (
                                                <p><strong>Edad:</strong> {calcularEdad(fichaSeleccionada.paciente.fechaNacimiento)} años</p>
                                            )}
                                        </div>
                                        <div>
                                            {fichaSeleccionada.paciente.genero && (
                                                <p><strong>Género:</strong> {fichaSeleccionada.paciente.genero}</p>
                                            )}
                                            {fichaSeleccionada.paciente.sistemaSalud && (
                                                <p><strong>Sistema de Salud:</strong> {fichaSeleccionada.paciente.sistemaSalud}</p>
                                            )}
                                        </div>
                                        <div>
                                            {fichaSeleccionada.paciente.alergias?.length > 0 && (
                                                <p><strong>Alergias:</strong> {fichaSeleccionada.paciente.alergias.join(', ')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Motivo y Anamnesis */}
                                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                                        🩺 Consulta Médica
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-semibold text-green-700">Motivo de consulta:</p>
                                            <p className="text-gray-700">{fichaSeleccionada.consulta.motivoConsulta || 'No especificado'}</p>
                                        </div>
                                        {fichaSeleccionada.consulta.anamnesis && (
                                            <div>
                                                <p className="font-semibold text-green-700">Anamnesis / Examen Físico:</p>
                                                <p className="text-gray-700 whitespace-pre-wrap">{fichaSeleccionada.consulta.anamnesis}</p>
                                            </div>
                                        )}
                                        {fichaSeleccionada.consulta.examenFisico && (
                                            <div>
                                                <p className="font-semibold text-green-700">Examen Físico:</p>
                                                <p className="text-gray-700 whitespace-pre-wrap">{fichaSeleccionada.consulta.examenFisico}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Signos Vitales */}
                                {fichaSeleccionada.consulta.signosVitales && formatearSignosVitales(fichaSeleccionada.consulta.signosVitales).length > 0 && (
                                    <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                                            ❤️ Signos Vitales
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                            {formatearSignosVitales(fichaSeleccionada.consulta.signosVitales).map((vital, idx) => (
                                                <div key={idx} className="bg-white px-3 py-2 rounded-lg font-medium text-gray-700">
                                                    {vital}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Diagnóstico y Plan */}
                                {(fichaSeleccionada.consulta.diagnostico || fichaSeleccionada.consulta.planTratamiento) && (
                                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                                            📋 Diagnóstico y Tratamiento
                                        </h3>
                                        <div className="space-y-3">
                                            {fichaSeleccionada.consulta.diagnostico && (
                                                <div>
                                                    <p className="font-semibold text-purple-700">Diagnóstico:</p>
                                                    <p className="text-gray-700 whitespace-pre-wrap">{fichaSeleccionada.consulta.diagnostico}</p>
                                                </div>
                                            )}
                                            {fichaSeleccionada.consulta.planTratamiento && (
                                                <div>
                                                    <p className="font-semibold text-purple-700">Plan de Tratamiento:</p>
                                                    <p className="text-gray-700 whitespace-pre-wrap">{fichaSeleccionada.consulta.planTratamiento}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Exámenes y Recetas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Exámenes */}
                                    {fichaSeleccionada.consulta.solicitudExamenes?.length > 0 && (
                                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5">
                                            <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
                                                🔬 Exámenes Solicitados
                                            </h3>
                                            <div className="space-y-2">
                                                {fichaSeleccionada.consulta.solicitudExamenes.map((examen, idx) => (
                                                    <div key={idx} className="bg-white px-3 py-2 rounded-lg text-gray-700">
                                                        • {examen}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recetas */}
                                    {fichaSeleccionada.consulta.recetas?.length > 0 && (
                                        <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-5">
                                            <h3 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
                                                💊 Recetas Médicas
                                            </h3>
                                            <div className="space-y-2">
                                                {fichaSeleccionada.consulta.recetas.map((receta, idx) => (
                                                    <div key={idx} className="bg-white px-3 py-2 rounded-lg text-gray-700">
                                                        <div className="flex justify-between items-center">
                                                            <span>• {receta.texto}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {dayjs(receta.fecha).format('DD/MM/YY')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Indicaciones y Observaciones */}
                                {(fichaSeleccionada.consulta.indicaciones || fichaSeleccionada.consulta.observaciones) && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
                                            📝 Indicaciones y Observaciones
                                        </h3>
                                        <div className="space-y-3">
                                            {fichaSeleccionada.consulta.indicaciones && (
                                                <div>
                                                    <p className="font-semibold text-indigo-700">Indicaciones:</p>
                                                    <p className="text-gray-700 whitespace-pre-wrap">{fichaSeleccionada.consulta.indicaciones}</p>
                                                </div>
                                            )}
                                            {fichaSeleccionada.consulta.observaciones && (
                                                <div>
                                                    <p className="font-semibold text-indigo-700">Observaciones:</p>
                                                    <p className="text-gray-700 whitespace-pre-wrap">{fichaSeleccionada.consulta.observaciones}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Antecedentes del Paciente */}
                                {(fichaSeleccionada.paciente.antecedentesMorbidos?.length > 0 || fichaSeleccionada.paciente.medicamentos?.length > 0) && (
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            📚 Antecedentes del Paciente
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {fichaSeleccionada.paciente.antecedentesMorbidos?.length > 0 && (
                                                <div>
                                                    <p className="font-semibold text-gray-700 mb-2">Antecedentes Mórbidos:</p>
                                                    <div className="space-y-1">
                                                        {fichaSeleccionada.paciente.antecedentesMorbidos.map((ant, idx) => (
                                                            <span key={idx} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
                                                                {ant}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {fichaSeleccionada.paciente.medicamentos?.length > 0 && (
                                                <div>
                                                    <p className="font-semibold text-gray-700 mb-2">Medicamentos Habituales:</p>
                                                    <div className="space-y-1">
                                                        {fichaSeleccionada.paciente.medicamentos.map((med, idx) => (
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
                                {fichaSeleccionada.paciente.higiene && Object.values(fichaSeleccionada.paciente.higiene).some(value => value !== null && value !== undefined && value !== "" && value !== 0 && value !== false) && (
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                                            🌿 Hábitos e Higiene
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            {fichaSeleccionada.paciente.higiene.fuma && (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <p className="font-semibold text-red-700 flex items-center gap-2">
                                                        🚬 Tabaquismo
                                                    </p>
                                                    <p className="text-red-600">
                                                        {fichaSeleccionada.paciente.higiene.fuma} cigarrillos por día
                                                    </p>
                                                </div>
                                            )}
                                            {fichaSeleccionada.paciente.higiene.agua > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <p className="font-semibold text-blue-700 flex items-center gap-2">
                                                        💧 Hidratación
                                                    </p>
                                                    <p className="text-blue-600">{fichaSeleccionada.paciente.higiene.agua} ml por día</p>
                                                </div>
                                            )}
                                            {fichaSeleccionada.paciente.higiene.ejercicioSemanal > 0 && (
                                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                    <p className="font-semibold text-orange-700 flex items-center gap-2">
                                                        🏃‍♂️ Ejercicio
                                                    </p>
                                                    <p className="text-orange-600">{fichaSeleccionada.paciente.higiene.ejercicioSemanal} horas por semana</p>
                                                </div>
                                            )}
                                            {fichaSeleccionada.paciente.higiene.nivelStress !== null && fichaSeleccionada.paciente.higiene.nivelStress !== undefined && (
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                    <p className="font-semibold text-purple-700 flex items-center gap-2">
                                                        Nivel de Estrés
                                                    </p>
                                                    <p className="text-purple-600">
                                                        {fichaSeleccionada.paciente.higiene.nivelStress === 0 && '😌 Bajo'}
                                                        {fichaSeleccionada.paciente.higiene.nivelStress === 1 && '😐 Medio'}
                                                        {fichaSeleccionada.paciente.higiene.nivelStress === 2 && '😰 Alto'}
                                                    </p>
                                                </div>
                                            )}
                                            {fichaSeleccionada.paciente.higiene.calidadDormir !== null && fichaSeleccionada.paciente.higiene.calidadDormir !== undefined && (
                                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                                    <p className="font-semibold text-indigo-700 flex items-center gap-2">
                                                        Calidad del Sueño
                                                    </p>
                                                    <p className="text-indigo-600">
                                                        {fichaSeleccionada.paciente.higiene.calidadDormir === 0 && '😴 Bueno'}
                                                        {fichaSeleccionada.paciente.higiene.calidadDormir === 1 && '😪 Regular'}
                                                        {fichaSeleccionada.paciente.higiene.calidadDormir === 2 && '😵 Malo'}
                                                    </p>
                                                </div>
                                            )}
                                            {fichaSeleccionada.paciente.higiene.habitoAlimenticio && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:col-span-2">
                                                    <p className="font-semibold text-yellow-700 flex items-center gap-2 mb-2">
                                                        🍎 Hábitos Alimenticios
                                                    </p>
                                                    <p className="text-yellow-600 whitespace-pre-wrap">{fichaSeleccionada.paciente.higiene.habitoAlimenticio}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tabla de Partos */}
                                {fichaSeleccionada.paciente.partos?.length > 0 && (
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
                                                {fichaSeleccionada.paciente.partos.map((parto, idx) => (
                                                    <tr key={idx} className="bg-white even:bg-pink-50">
                                                        <td className="border px-3 py-2 text-center">{idx + 1}</td>
                                                        <td className="border px-3 py-2">{parto.fecha ? dayjs(parto.fecha).format('DD-MM-YYYY') : '-'}</td>
                                                        <td className="border px-3 py-2">{parto.genero ?? '-'}</td>
                                                        <td className="border px-3 py-2 text-center">{parto.abortado ? 'Sí' : 'No'}</td>
                                                        <td className="border px-3 py-2 font-semibold">
                                                            {parto.fueCesarea ? (
                                                                <span className="text-red-600">Cesárea</span>
                                                            ) : parto.fueNormal ? (
                                                                <span className="text-green-700">Normal</span>
                                                            ) : (
                                                                <span className="text-gray-500">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
}