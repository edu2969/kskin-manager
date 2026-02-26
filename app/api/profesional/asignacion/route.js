import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

export async function POST(req) {
    try {
        console.log("[asignacion] Iniciando petición");
        
        const supabase = await getSupabaseServerClient();
        const { user } = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: usuario, error: userError } = await supabase
            .from("usuarios")
            .select("id, rol, email")
            .eq("id", user.id)
            .single();

        if (userError || !usuario || usuario.rol !== USER_ROLE.profesional) {
            return NextResponse.json({ error: "Solo profesionales pueden asignar box" }, { status: 403 });
        }

        const { boxId, pacienteId, tiempoEstimado } = await req.json();
        console.log("[asignacion] Datos recibidos - boxId:", boxId, "pacienteId:", pacienteId, "tiempoEstimado:", tiempoEstimado);
        if (!boxId || !tiempoEstimado || !pacienteId) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        const { data: box, error: boxError } = await supabase
            .from("boxes")
            .select("id, numero, inicio_atencion, termino_atencion")
            .eq("id", boxId)
            .single();

        if (boxError || !box) {
            return NextResponse.json({ error: "Box no encontrado: " + boxError }, { status: 404 });
        }

        const { data: profesional, error: profesionalError } = await supabase
            .from("profesionales")
            .select("id")
            .eq("usuario_id", usuario.id)
            .single();

        if (profesionalError || !profesional) {
            return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
        }

        const ahora = new Date().toISOString();

        const { data: boxActualizado, error: boxUpdateError } = await supabase
            .from("boxes")
            .update({
                inicio_atencion: ahora,
                profesional_id: profesional.id,
                paciente_id: pacienteId,
                updated_at: ahora,
            })
            .eq("id", box.id)
            .select("id, numero, ocupado, paciente_id, profesional_id, inicio_atencion, termino_atencion")
            .single();

        if (boxUpdateError || !boxActualizado) {
            console.error("[asignacion] Error actualizando box:", boxUpdateError);
            return NextResponse.json({ error: boxUpdateError?.message || "Error actualizando box" }, { status: 500 });
        }

        const inicioDelDia = new Date();
        inicioDelDia.setHours(0, 0, 0, 0);
        const finDelDia = new Date();
        finDelDia.setHours(23, 59, 59, 999);

        const { data: fichaDelDia } = await supabase
            .from("fichas")
            .select("id")
            .eq("paciente_id", pacienteId)
            .gte("created_at", inicioDelDia.toISOString())
            .lte("created_at", finDelDia.toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fichaDelDia) {
            const { error: fichaUpdateError } = await supabase
                .from("fichas")
                .update({
                    profesional_id: profesional.id
                })
                .eq("id", fichaDelDia.id);

            if (fichaUpdateError) {
                console.error("[asignacion] Error actualizando ficha del día:", fichaUpdateError);
                return NextResponse.json({ error: fichaUpdateError.message }, { status: 500 });
            }
        } else {
            const { data: fichaReciente } = await supabase
                .from("fichas")
                .select("tratamiento, examenes")
                .eq("paciente_id", pacienteId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            const { error: fichaCreateError } = await supabase
                .from("fichas")
                .insert({
                    paciente_id: pacienteId,
                    profesional_id: profesional.id,
                    fecha: ahora,
                    tratamiento: fichaReciente?.tratamiento || null,
                    examenes: fichaReciente?.examenes || null
                });

            if (fichaCreateError) {
                console.error("[asignacion] Error creando ficha:", fichaCreateError);
                return NextResponse.json({ error: fichaCreateError.message }, { status: 500 });
            }
        }

        const { data: arriboActual, error: arriboError } = await supabase
            .from("arribos")
            .select("id")
            .eq("paciente_id", pacienteId)
            .is("fecha_termino", null)
            .single();

        if (!arriboActual || arriboError) {
            return NextResponse.json({ error: "Arribo del paciente no encontrado: " + arriboError?.message }, { status: 404 });
        }

        const { error: arriboUpdateError } = await supabase
            .from("arribos")
            .update({
                profesional_id: profesional.id,
                fecha_atencion: ahora
            })
            .eq("id", arriboActual.id);

        if (arriboUpdateError) {
            console.error("[asignacion] Error actualizando arribo:", arriboUpdateError);
            return NextResponse.json({ error: arriboUpdateError.message }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            box: {
                id: boxActualizado.id,
                numero: boxActualizado.numero,
                pacienteId: boxActualizado.paciente_id,
                profesionalId: boxActualizado.profesional_id,
                inicioAtencion: boxActualizado.inicio_atencion,
                terminoAtencion: boxActualizado.termino_atencion,
                tiempoEstimado,
            },
        });
    } catch (error) {
        console.error("[asignacion] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}