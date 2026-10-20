import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";
import { isValidRutFormat, cleanRut } from "@/app/utils/rutFormatter";

export async function POST(req) {
    console.log("[POST] /api/paciente - Iniciando petición");

    const supabase = await getSupabaseServerClient();

    // Usuario autenticado
    const { data: user } = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
        );
    }

    // Validar rol: solo profesional o recepcionista pueden crear pacientes
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
        console.warn("Acceso denegado: rol no permitido", usuario?.rol);
        return NextResponse.json(
            { error: "Acceso denegado" },
            { status: 403 }
        );
    }

    // Parsear body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json(
            { error: "Cuerpo de petición inválido" },
            { status: 400 }
        );
    }

    const {
        nombres,
        apellidos,
        numeroIdentidad,
        email,
        fechaNacimiento,
        genero,
        nombreSocial,
        grupoSanguineo,
        direccion,
        telefono,
        sistemaSaludId,
        alergias,
        operaciones,
    } = body;

    // Validaciones requeridas
    if (!nombres || !apellidos || !numeroIdentidad || !genero) {
        return NextResponse.json(
            { error: "Faltan campos requeridos: nombres, apellidos, numeroIdentidad, genero" },
            { status: 400 }
        );
    }

    // Validar formato de RUT
    if (!isValidRutFormat(numeroIdentidad)) {
        return NextResponse.json(
            { error: "El RUT ingresado no es válido" },
            { status: 400 }
        );
    }

    // Normalizar RUT (quitar puntos, dejar solo dígitos + DV)
    const numeroIdentidadLimpio = cleanRut(numeroIdentidad);

    // Verificar si el paciente ya existe
    const { data: existente } = await supabase
        .from("pacientes")
        .select("id")
        .eq("numero_identidad", numeroIdentidadLimpio)
        .maybeSingle();

    if (existente) {
        return NextResponse.json(
            { error: "Ya existe un paciente con este RUT" },
            { status: 409 }
        );
    }

    // Insertar nuevo paciente
    const { data: paciente, error: insertError } = await supabase
        .from("pacientes")
        .insert({
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            numero_identidad: numeroIdentidadLimpio,
            email: email || null,
            fecha_nacimiento: fechaNacimiento || null,
            genero,
            nombre_social: nombreSocial || null,
            grupo_sanguineo: grupoSanguineo || null,
            direccion: direccion || null,
            telefono: telefono || null,
            sistema_salud_id: sistemaSaludId || null,
            alergias: alergias || null,
            operaciones: operaciones || null,
        })
        .select()
        .single();

    if (insertError) {
        console.error("Error al crear paciente:", insertError);
        return NextResponse.json(
            { error: "Error al crear paciente" },
            { status: 500 }
        );
    }

    console.log("Paciente creado:", paciente.id);

    return NextResponse.json({
        ok: true,
        paciente: {
            id: paciente.id,
            nombres: paciente.nombres,
            apellidos: paciente.apellidos,
            numeroIdentidad: paciente.numero_identidad,
            genero: paciente.genero,
            email: paciente.email,
            fechaNacimiento: paciente.fecha_nacimiento,
            nombreSocial: paciente.nombre_social,
            direccion: paciente.direccion,
            telefono: paciente.telefono,
        },
    }, { status: 201 });
}
