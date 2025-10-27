import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Ficha from "@/models/ficha";
import Paciente from "@/models/paciente";
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
    
    // Obtener la ficha del día actual del paciente
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const profesional = await Profesional.findOne({ userId: session.user.id })
        .populate({ path: "userId", select: "email name" })
        .lean();

    let ficha = await Ficha.findOne({ 
        pacienteId,
        profesionalId: profesional._id,
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).lean();

    if (!ficha) {
        ficha = await Ficha.create({ 
            pacienteId,
            profesionalId: profesional._id
         });
    }

    // Poblar datos del paciente
    const paciente = await Paciente.findById(pacienteId).lean();
    
    return NextResponse.json({
        ficha,
        paciente,
        profesional
    });
}