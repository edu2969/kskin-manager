import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Ficha from "@/models/ficha";
import Profesional from "@/models/profesional";
import User from "@/models/user";
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

    // Obtener fichas históricas del paciente
    const fichas = await Ficha.find({ 
        pacienteId,
        createdAt: { $lt: startOfToday }
    })
    .sort({ createdAt: -1 })
    .select("_id createdAt profesionalId")
    .lean();

    // Obtener información de profesionales
    const profesionalIds = [...new Set(fichas.map(ficha => ficha.profesionalId))];
    const profesionales = await Profesional.find({ _id: { $in: profesionalIds } })
        .populate({ path: "userId", select: "name" })
        .lean();

    // Mapear profesionales por ID para acceso rápido
    const profesionalesMap = profesionales.reduce((acc, prof) => {
        acc[prof._id] = prof;
        return acc;
    }, {});

    // Construir respuesta con datos combinados
    const historico = fichas.map(ficha => ({
        _id: ficha._id,
        fecha: ficha.createdAt,
        profesional: {
            _id: ficha.profesionalId,
            nombre: profesionalesMap[ficha.profesionalId]?.userId?.name || 'Profesional no encontrado'
        }
    }));

    return NextResponse.json({ historico });
}