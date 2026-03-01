import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET(req) {
    console.log("[GET] /api/paciente/historico - Iniciando petición");
    
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get("pacienteId");

    if (!pacienteId) {
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const { data: user } = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (userError || !usuario || (usuario.rol !== USER_ROLE.profesional && usuario.rol !== USER_ROLE.recepcionista)) {
        console.warn("Acceso denegado: rol no permitido", usuario?.rol);
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { data: fichas, error: fichasError } = await supabase
        .from("fichas")
        .select(`
            id, fecha, tratamiento, anamnesis,
            profesional:profesionales (
                usuario_id ( nombre, email ),
                profesional_especialidades (
                    especialidad_id:especialidades ( nombre )
                )
            )
        `)
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });

    console.log("**** Solo especialidades -------------->", fichas?.map(f => f.profesional?.profesional_especialidades?.map(e => e.especialidad_id?.nombre)));

    if (fichasError) {
        console.error("Error al consultar fichas históricas:", fichasError);
        return NextResponse.json({ error: "Error al consultar fichas históricas" }, { status: 500 });
    }

    console.log("Formateando respuesta...");
    const historico = fichas.map(ficha => ({
        fichaId: ficha.id,
        fecha: ficha.fecha,
        nombreProfesional: ficha.profesional?.usuario_id?.nombre,
        especialidades: ficha.profesional?.profesional_especialidades?.map(e => e.especialidad_id?.nombre) || [],
        alias: ficha.profesional?.usuario_id?.email?.split("@")[0] || "none",
        tratamiento: ficha.tratamiento,
        anamnesis: ficha.anamnesis
    }));

    console.log("Respuesta formateada:", historico);

    return NextResponse.json({ historico });
}