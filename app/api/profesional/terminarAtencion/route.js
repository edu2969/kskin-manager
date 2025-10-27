import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Arribo from "@/models/arribo";
import Box from "@/models/box";
import Ficha from "@/models/ficha";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import Profesional from "@/models/profesional";

export async function POST(req) {
    await connectMongoDB();
    console.log("[terminarAtencion] Conexión a MongoDB establecida");

    const session = await getServerSession(authOptions);
    console.log("[terminarAtencion] Sesión obtenida:", session ? session.user?.email : "No session");

    if (!session || !session.user) {
        console.warn("[terminarAtencion] No autorizado");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    console.log("[terminarAtencion] Usuario encontrado:", user ? user.email : "No user");

    if (!user || user.role !== USER_ROLE.profesional) {
        console.warn("[terminarAtencion] Acceso denegado para usuario:", user ? user.email : "No user");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const profesional = await Profesional.findOne({ userId: user._id });
    if(!profesional) {
        console.warn("[terminarAtencion] Profesional no encontrado para usuario:", user.email);
        return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    // Buscar la ficha más reciente del profesional que esté siendo editada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const ficha = await Ficha.findOne({
        profesionalId: profesional._id,
        createdAt: { $gte: hoy, $lt: manana }
    }).sort({ createdAt: -1 });

    if (!ficha) {
        console.warn("[terminarAtencion] No se encontró ficha para el profesional");
        return NextResponse.json({ error: "No se encontró ficha activa" }, { status: 404 });
    }

    console.log("[terminarAtencion] Ficha encontrada:", ficha._id);

    const fechaTermino = new Date();

    try {
        // 1. Actualizar arribo con fecha de retiro
        await Arribo.updateOne(
            { 
                pacienteId: ficha.pacienteId,
                profesionalId: profesional._id,
                fechaRetiro: { $exists: false }
            },
            { 
                fechaRetiro: fechaTermino 
            }
        );
        console.log("[terminarAtencion] Arribo actualizado para paciente:", ficha.pacienteId);

        // 2. Finalizar atención en box y liberar
        await Box.updateOne(
            { 
                pacienteId: ficha.pacienteId,
                profesionalId: profesional._id,
                terminoAtencion: { $exists: false }
            },
            { 
                terminoAtencion: fechaTermino,
                'ocupacion.ocupado': false,
                'ocupacion.fechaCambio': fechaTermino,
                pacienteId: null,
                profesionalId: null
            }
        );
        console.log("[terminarAtencion] Box liberado para paciente:", ficha.pacienteId);

        return NextResponse.json({ ok: true, message: "Atención terminada correctamente" });

    } catch (error) {
        console.error("[terminarAtencion] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}