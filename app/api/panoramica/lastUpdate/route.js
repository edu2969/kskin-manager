import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET() {
    console.log("[GET] /api/panoramica/lastUpdate - Iniciando petición");

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
        console.log("[GET] /api/panoramica/lastUpdate - Rol de usuario no permitido");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Consultar la fecha más reciente de updated_at en boxes y pacientes
    const { data: lastBox, error: boxError } = await supabase
        .from("boxes")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

    const { data: lastPaciente, error: pacienteError } = await supabase
        .from("pacientes")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (boxError || pacienteError) {
        console.log("[GET] /api/panoramica/lastUpdate - Error al consultar fechas", boxError, pacienteError);
        return NextResponse.json({ error: "Error al consultar fechas" }, { status: 500 });
    }

    let lastUpdate = null;
    if (lastBox && lastPaciente) {
        lastUpdate = new Date(lastBox.updated_at) > new Date(lastPaciente.updated_at)
            ? lastBox.updated_at
            : lastPaciente.updated_at;
    } else if (lastBox) {
        lastUpdate = lastBox.updated_at;
    } else if (lastPaciente) {
        lastUpdate = lastPaciente.updated_at;
    }

    console.log("[GET] /api/panoramica/lastUpdate - Última actualización encontrada");
    return NextResponse.json({ lastUpdate });
}