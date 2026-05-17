import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET(req, { params }) {
    const id = await params;
    console.log("[GET] /api/paciente/byId - Iniciando petición", id);

    const supabase = await getSupabaseServerClient();

    if (!id || id.length === 0) {
        console.warn("Falta el parámetro id");
        return NextResponse.json({ error: "Falta el parámetro id" }, { status: 400 });
    }

    const { data: user } = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

    console.log("Buscando paciente con id:", id);

    const { data: paciente, error: pacienteError } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", id.id[0])
        .maybeSingle();

    if (pacienteError) {
        console.error("Error al buscar paciente por rut:", pacienteError);
        return NextResponse.json({ error: "Error al buscar paciente" }, { status: 500 });
    }

    if ( !paciente) {
        console.log("Paciente no encontrado para rut:", rut);        
        return NextResponse.json({ ok: true, paciente: { nuevo: true }}, { status: 200 });
    }

    return NextResponse.json({ ok: true, paciente });
}