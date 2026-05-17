import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

export async function GET(req) {
    console.log("[GET] /api/pacientes/search - Iniciando petición");

    const supabase = await getSupabaseServerClient();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    if (!search || search.length < 4) {
        return NextResponse.json(
            { error: "Debe ingresar al menos 4 caracteres" },
            { status: 400 }
        );
    }

    // Usuario autenticado
    const { data: user } = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
        );
    }

    // Validar rol
    const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (
        userError ||
        !usuario ||
        (
            usuario.rol !== USER_ROLE.profesional &&
            usuario.rol !== USER_ROLE.recepcionista
        )
    ) {
        console.warn(
            "Acceso denegado: rol no permitido",
            usuario?.rol
        );

        return NextResponse.json(
            { error: "Acceso denegado" },
            { status: 403 }
        );
    }

    console.log("Buscando pacientes:", search);

    // Buscar por nombre o rut
    const { data: pacientes, error: pacientesError } = await supabase
        .from("pacientes")
        .select(`
            id,
            nombres,
            apellidos,
            numero_identidad
        `)
        .or(`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,numero_identidad.ilike.%${search}%`)
        .order("nombres", { ascending: true })
        .limit(20);

    if (pacientesError) {
        console.error(
            "Error buscando pacientes:",
            pacientesError
        );

        return NextResponse.json(
            { error: "Error buscando pacientes" },
            { status: 500 }
        );
    }

    console.log("Pacientes encontrados:", pacientes?.length);

    const resultados = pacientes.map(paciente => ({
        id: paciente.id,
        nombre: `${paciente.nombres} ${paciente.apellidos}`,
        rut: paciente.numero_identidad
    }));

    return NextResponse.json(resultados);
}