import { NextResponse } from "next/server";
import Paciente from "@/models/paciente";
import Box from "@/models/box";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });

    if (!user || user.role !== USER_ROLE.profesional || user.role !== USER_ROLE.recepcion) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Busca la fecha más reciente de updatedAt en Box y Paciente
    const lastBox = await Box.findOne({}).sort({ updatedAt: -1 }).select("updatedAt");
    const lastPaciente = await Paciente.findOne({}).sort({ updatedAt: -1 }).select("updatedAt");

    let lastUpdate = null;
    if (lastBox && lastPaciente) {
        lastUpdate = lastBox.updatedAt > lastPaciente.updatedAt ? lastBox.updatedAt : lastPaciente.updatedAt;
    } else if (lastBox) {
        lastUpdate = lastBox.updatedAt;
    } else if (lastPaciente) {
        lastUpdate = lastPaciente.updatedAt;
    }

    return NextResponse.json({ lastUpdate });
}