import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Paciente from "@/models/paciente";
import Arribo from "@/models/arribo";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";

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

    return NextResponse.json({ arribo: nuevoArribo });
}