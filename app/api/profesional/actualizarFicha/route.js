import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Paciente from "@/models/paciente";
import Ficha from "@/models/ficha";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import Profesional from "@/models/profesional";

export async function POST(req) {
    await connectMongoDB();
    console.log("[actualizarFicha] Conexión a MongoDB establecida");

    const session = await getServerSession(authOptions);
    console.log("[actualizarFicha] Sesión obtenida:", session ? session.user?.email : "No session");

    if (!session || !session.user) {
        console.warn("[actualizarFicha] No autorizado");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    console.log("[actualizarFicha] Usuario encontrado:", user ? user.email : "No user");

    if (!user || (user.role !== USER_ROLE.profesional && user.role !== USER_ROLE.recepcionista)) {
        console.warn("[actualizarFicha] Acceso denegado para usuario:", user ? user.email : "No user");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await req.json();
    const { pacienteId, atributo, valor } = body;
    console.log("[actualizarFicha] Body recibido:", body);

    if (!pacienteId || !atributo) {
        console.warn("[actualizarFicha] pacienteId o atributo faltante");
        return NextResponse.json({ error: "pacienteId y atributo requeridos" }, { status: 400 });
    }

    // Buscar la ficha de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const profesional = await Profesional.findOne({ userId: user._id });
    if(!profesional) {
        console.warn("[actualizarFicha] Profesional no encontrado para usuario:", user.email);
        return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    let ficha = await Ficha.findOne({
        pacienteId,
        profesionalId: profesional._id,
        createdAt: { $gte: hoy, $lt: manana }
    });
    console.log("[actualizarFicha] Ficha encontrada:", ficha ? ficha._id : "No ficha");

    // Manejo simplificado - solo actualización directa sin historial individual
    // El historial completo se crea al finalizar la consulta
    try {
        // Determinar si el atributo pertenece a la ficha o al paciente
        if (['anamnesis', 'indicaciones', 'solicitudExamenes', 'recetas'].includes(atributo)) {
            // Atributos de la ficha
            if (!ficha) {
                // Crear ficha si no existe
                ficha = await Ficha.create({
                    pacienteId,
                    profesionalId: profesional._id,
                    [atributo]: valor
                });
                console.log(`[actualizarFicha] Nueva ficha creada con ${atributo}`);
            } else {
                // Actualizar ficha existente
                await Ficha.findByIdAndUpdate(
                    ficha._id,
                    { [atributo]: valor },
                    { new: true }
                );
                console.log(`[actualizarFicha] Ficha actualizada: ${atributo}`);
            }
        } else {
            // Atributos del paciente
            await Paciente.findByIdAndUpdate(
                pacienteId,
                { [atributo]: valor },
                { new: true }
            );
            console.log(`[actualizarFicha] Paciente actualizado: ${atributo}`);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[actualizarFicha] Error procesando actualización:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// FUNCIONES AUXILIARES REMOVIDAS: 
// El nuevo modelo ya no registra cambios individuales.
// Todo el historial se guarda como snapshot completo al finalizar la consulta.