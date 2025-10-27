import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Paciente from "@/models/paciente";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET(req) {
    console.log("Conectando a MongoDB...");
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const rut = searchParams.get("rut");
    console.log("Rut recibido:", rut);

    if (!rut) {
        console.warn("Falta el parámetro rut");
        return NextResponse.json({ error: "Falta el parámetro rut" }, { status: 400 });
    }

    console.log("Obteniendo sesión del usuario...");
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        console.warn("No autorizado: sesión inválida");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("Buscando usuario por email:", session.user.id);
    const user = await User.findOne({ _id: session.user.id });

    if (!user) {
        console.warn("Acceso denegado: usuario no encontrado");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    if (user.role !== USER_ROLE.profesional && user.role !== USER_ROLE.recepcionista) {
        console.warn("Acceso denegado: rol no permitido", user.role);
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    console.log("Buscando paciente por rut:", rut);
    const paciente = await Paciente.findOne({ rut });

    if (!paciente) {
        console.log("Paciente no encontrado para rut:", rut);
        return NextResponse.json({ ok: false });
    }

    console.log("Paciente encontrado:", paciente._id);
    return NextResponse.json({ ok: true, paciente });
}