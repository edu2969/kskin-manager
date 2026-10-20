import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await getSupabaseServerClient();
    const { data: medicamentos, error } = await supabase
        .from('medicamentos')
        .select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ medicamentos });
}

export async function POST(request) {
    try {
        const supabase = await getSupabaseServerClient();
        const body = await request.json();
        const { nombre } = body;

        if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
            return NextResponse.json({ error: "Nombre de medicamento requerido" }, { status: 400 });
        }

        const nombreTrimmed = nombre.trim();

        // Evitar duplicados: buscar si ya existe (case-insensitive)
        const { data: existing, error: existingError } = await supabase
            .from("medicamentos")
            .select("id, nombre")
            .ilike("nombre", nombreTrimmed)
            .limit(1);

        if (existingError) {
            return NextResponse.json({ error: existingError.message }, { status: 500 });
        }

        if (existing && existing.length > 0) {
            return NextResponse.json(existing[0], { status: 200 });
        }

        const { data, error } = await supabase
            .from("medicamentos")
            .insert({ nombre: nombreTrimmed })
            .select("id, nombre")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}