import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Ficha from "@/models/ficha";
import User from "@/models/user";
import Profesional from "@/models/profesional";
import Especialidad from "@/models/especialidad";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

export async function GET(req) {
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get("pacienteId");

    if (!pacienteId) {
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener fechas anteriores a hoy 00:00
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Obtener fichas históricas del paciente con toda la información poblada
    const fichas = await Ficha.find({ 
        pacienteId,
        createdAt: { $lt: startOfToday }
    })
    .populate({
        path: 'profesionalId',
        populate: [
            { 
                path: 'userId', 
                select: 'name email' 
            },
            { 
                path: 'especialidadIds', 
                select: 'nombre' 
            }
        ]
    })
    .populate({
        path: 'pacienteId'
    })
    .sort({ createdAt: -1 })
    .lean();

    // Formatear la respuesta para el frontend
    const historico = fichas.map(ficha => ({
        _id: ficha._id,
        fecha: ficha.createdAt,
        
        // Información del profesional
        profesional: {
            _id: ficha.profesionalId?._id,
            nombre: ficha.profesionalId?.userId?.name || 'Sin profesional asignado',
            email: ficha.profesionalId?.userId?.email,
            especialidades: ficha.profesionalId?.especialidadIds?.map(esp => esp.nombre) || []
        },
        
        // Información del paciente
        paciente: {
            _id: ficha.pacienteId?._id,
            nombres: ficha.pacienteId?.nombres,
            apellidos: ficha.pacienteId?.apellidos,
            rut: ficha.pacienteId?.rut,
            fechaNacimiento: ficha.pacienteId?.fechaNacimiento,
            genero: ficha.pacienteId?.genero,
            sistemaSalud: ficha.pacienteId?.sistemaSalud,
            alergias: ficha.pacienteId?.alergias || [],
            antecedentesMorbidos: ficha.pacienteId?.antecedenteMorbidoIds?.map(ant => ant.glosa || ant.nombre || ant) || [],
            medicamentos: ficha.pacienteId?.medicamentoIds?.map(med => ({
                nombre: med.glosa || med.nombre || med,
                unidades: med.unidades,
                frecuencia: med.frecuencia
            })) || [],
            partos: ficha.pacienteId?.partos || [],
            higiene: ficha.pacienteId?.higiene || {}
        },
        
        // Información de la consulta
        consulta: {
            motivoConsulta: ficha.motivoConsulta,
            anamnesis: ficha.anamnesis,
            examenFisico: ficha.examenFisico,
            diagnostico: ficha.diagnostico,
            planTratamiento: ficha.planTratamiento,
            observaciones: ficha.observaciones,
            
            // Signos vitales
            signosVitales: {
                presionArterial: ficha.presionArterial,
                frecuenciaCardiaca: ficha.frecuenciaCardiaca,
                temperatura: ficha.temperatura,
                peso: ficha.peso,
                talla: ficha.talla,
                imc: ficha.imc
            },
            
            // Solicitudes y tratamientos
            solicitudExamenes: ficha.solicitudExamenes || [],
            indicaciones: ficha.indicaciones,
            recetas: ficha.recetas || [],
            
            // Información temporal
            estadoConsulta: ficha.estadoConsulta,
            horaInicio: ficha.horaInicio,
            horaFin: ficha.horaFin,
            duracionMinutos: ficha.duracionMinutos
        }
    }));

    return NextResponse.json({ historico });
}