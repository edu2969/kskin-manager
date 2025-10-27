import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Paciente from "@/models/paciente";
import Profesional from "@/models/profesional";
import Box from "@/models/box";
import User from "@/models/user";
import Arribo from "@/models/arribo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET(req) {
    await connectMongoDB();
    console.log("[GET] /api/panoramica - Iniciando petición");

    if (!mongoose.models.Profesional) {
        mongoose.model("Profesional", Profesional.schema);
    }
    if (!mongoose.models.Paciente) {
        mongoose.model("Paciente", Paciente.schema);
    }

    const session = await getServerSession(authOptions);
    console.log("[GET] /api/panoramica - Session:", session ? "Existe" : "No existe");

    if (!session || !session.user || !session.user.id) {
        console.log("[GET] /api/panoramica - Usuario no autorizado");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Busca el usuario por email
    const user = await User.findOne({ _id: session.user.id });
    console.log("[GET] /api/panoramica - Usuario encontrado:", !!user);

    if (!user) {
        console.log("[GET] /api/panoramica - Usuario no encontrado");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    if (user.role !== USER_ROLE.profesional && user.role !== USER_ROLE.recepcionista) {
        console.log("[GET] /api/panoramica - Rol de usuario no permitido:", user.role);
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtiene todos los pacientes y boxes
    console.log("[GET] /api/panoramica - Consultando pacientes y boxes");
    const boxes = await Box.find().populate("pacienteId").populate("profesionalId");
    const pacienteAtendiendoseIds = boxes.filter(box => box.profesionalId == null).flatMap(box => box.pacienteId);
    const pacientes = await Paciente.find({
        _id: {
            $nin: pacienteAtendiendoseIds,
        }
    });

    // Obtiene arribos
    const arribos = await Arribo.find({
        fechaLlegada: { $exists: true },
        fechaRetino: { $exists: false }
    }).populate("pacienteId").populate("profesionalId");
    
    console.log("[GET] /api/panoramica - Pacientes encontrados:", pacientes.length);
    console.log("[GET] /api/panoramica - Boxes encontrados:", boxes.length);

    return NextResponse.json({ arribos, boxes });
}