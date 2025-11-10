import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Paciente from "@/models/paciente";
import Arribo from "@/models/arribo";
import Ficha from "@/models/ficha";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import { crearSnapshotPaciente } from "@/app/api/paciente/crearSnapshot/route";

// Registrando arribo
export async function POST(req) {
    console.log("[POST] /api/recepcion - Conectando a MongoDB...");
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    console.log("[POST] /api/recepcion - session:", session);

    if (!session || !session.user) {
        console.warn("[POST] /api/recepcion - No autorizado");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    console.log("[POST] /api/recepcion - user:", user);

    if (!user || (user.role !== USER_ROLE.recepcionista && user.role !== USER_ROLE.profesional)) {
        console.warn("[POST] /api/recepcion - Acceso denegado para el usuario:", session.user.id);
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await req.json();
    console.log("[POST] /api/recepcion - body recibido:", body);

    let pacienteId = body.pacienteId;

    // Si no viene el pacienteId, crea el paciente
    if (!pacienteId) {
        const pacienteData = body.paciente;
        if (!pacienteData) {
            console.error("[POST] /api/recepcion - Datos de paciente requeridos");
            return NextResponse.json({ error: "Datos de paciente requeridos" }, { status: 400 });
        }
        console.log("[POST] /api/recepcion - Creando nuevo paciente:", pacienteData);
        const nuevoPaciente = await Paciente.create(pacienteData);
        pacienteId = nuevoPaciente._id;
        console.log("[POST] /api/recepcion - Nuevo paciente creado con ID:", pacienteId);
    }

    // Crea el arribo
    const arriboData = {
        pacienteId,
        fechaLlegada: new Date()
    };
    console.log("[POST] /api/recepcion - Creando arribo:", arriboData);

    const nuevoArribo = await Arribo.create(arriboData);
    console.log("[POST] /api/recepcion - Nuevo arribo creado:", nuevoArribo);

    // Crear ficha inicial sin profesional asignado
    const nuevaFicha = await Ficha.create({
        pacienteId: pacienteId,
        profesionalId: null, // Sin profesional asignado inicialmente
        estadoConsulta: "PENDIENTE",
        motivoConsulta: "Consulta general", // Valor por defecto
        // Otros campos opcionales se inicializan como null/vacío
    });
    console.log("[POST] /api/recepcion - Nueva ficha creada:", nuevaFicha._id);

    // Crear snapshot inicial del paciente
    try {
        await crearSnapshotPaciente(
            pacienteId, 
            user._id, 
            null, // Sin profesional
            nuevaFicha._id, 
            'REGISTRO_INICIAL',
            `Paciente registrado en recepción el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}`
        );
        console.log("[POST] /api/recepcion - Snapshot inicial creado");
    } catch (error) {
        console.warn("[POST] /api/recepcion - Error creando snapshot inicial:", error.message);
        // No fallar la operación por el snapshot
    }

    return NextResponse.json({ 
        arribo: nuevoArribo,
        ficha: {
            _id: nuevaFicha._id,
            estadoConsulta: nuevaFicha.estadoConsulta
        }
    });
}