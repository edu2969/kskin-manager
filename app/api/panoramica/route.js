import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET() {
    console.log("[GET] /api/panoramica - Iniciando petición");
    
    const supabase = await getSupabaseServerClient();
    const { user } = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verificar rol del usuario
    const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (userError || !usuario || (usuario.rol !== USER_ROLE.recepcionista && usuario.rol !== USER_ROLE.profesional)) {
        console.log("[GET] /api/panoramica - Rol de usuario no permitido");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Consultar boxes y pacientes
    const { data: boxes, error: boxesError } = await supabase
        .from("boxes")
        .select("*, paciente_id(*), profesional_id(*)");

    if (boxesError) {
        console.log("[GET] /api/panoramica - Error al consultar boxes", boxesError);
        return NextResponse.json({ error: "Error al consultar boxes" }, { status: 500 });
    }

    // Consultar arribos
    const { data: arribos, error: arribosError } = await supabase
        .from("arribos")
        .select("*, paciente_id(*)")
        .is("fecha_atencion", null)
        .is("fecha_termino", null);

    if (arribosError) {
        console.log("[GET] /api/panoramica - Error al consultar arribos", arribosError);
        return NextResponse.json({ error: "Error al consultar arribos" }, { status: 500 });
    }

    console.log("[GET] /api/panoramica - Datos obtenidos correctamente");
    return NextResponse.json({ arribos: arribos.map(a => ({
        paciente: {
            id: a.paciente_id.id,
            nombres: a.paciente_id.nombres,
            apellidos: a.paciente_id.apellidos,
            genero: a.paciente_id.genero
        },
        fechaAtencion: a.fecha_atencion,
        fechaTermino: a.fecha_termino
    })), boxes: boxes.map(b => ({
        id: b.id,
        numero: b.numero,
        paciente: b.paciente_id ? {
            id: b.paciente_id.id,
            nombres: b.paciente_id.nombres,
            apellidos: b.paciente_id.apellidos,
            genero: b.paciente_id.genero
        } : null,
        profesional: b.profesional_id ? {
            id: b.profesional_id.id,
            nombres: b.profesional_id.nombres,
            apellidos: b.profesional_id.apellidos
        } : null,
        fechaInicio: b.fecha_inicio,
        fechaTermino: b.fecha_termino
    })) });
}