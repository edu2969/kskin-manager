import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET(req) {
    console.log("[GET] /api/recepcion/pacientePorRut - Iniciando petición");
    const { searchParams } = new URL(req.url);
    const rut = searchParams.get("rut");

    if (!rut) {
        console.warn("Falta el parámetro rut");
        return NextResponse.json({ error: "Falta el parámetro rut" }, { status: 400 });
    }

    const { user } = await getAuthenticatedUser();
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

    const { data: paciente, error: pacienteError } = await supabase
        .from("pacientes")
        .select("*")
        .eq("numero_identidad", rut)
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