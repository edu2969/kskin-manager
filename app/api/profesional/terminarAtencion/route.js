import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

export async function POST() {
    try {
        console.log("[terminarAtencion] Iniciando petición");
        
        const supabase = await getSupabaseServerClient();
        const { data: user } = await getAuthenticatedUser();
        if (!user) {
            console.warn("[terminarAtencion] No autorizado");
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        console.log("[terminarAtencion] Usuario autenticado:", user.email);

        // Verificar rol del usuario
        const { data: usuario, error: userError } = await supabase
            .from("usuarios")
            .select("id, rol, email")
            .eq("id", user.id)
            .single();

        if (userError || !usuario || usuario.rol !== USER_ROLE.profesional) {
            console.warn("[terminarAtencion] Acceso denegado para usuario:", usuario?.email);
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        // Obtener profesional vinculado al usuario
        const { data: profesional, error: profError } = await supabase
            .from("profesionales")
            .select("id")
            .eq("usuario_id", usuario.id)
            .single();

        if (profError || !profesional) {
            console.warn("[terminarAtencion] Profesional no encontrado para usuario:", usuario.email);
            return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
        }

        // Buscar la ficha más reciente del profesional de hoy sin finalizar
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);

        const { data: ficha, error: fichaError } = await supabase
            .from("fichas")
            .select("id, paciente_id, created_at")
            .eq("profesional_id", profesional.id)
            .is("finished_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (fichaError || !ficha) {
            console.warn("[terminarAtencion] No se encontró ficha para el profesional", fichaError);
            return NextResponse.json({ error: "No se encontró ficha activa" }, { status: 404 });
        }

        console.log("[terminarAtencion] Ficha encontrada:", ficha.id);

        const fechaTermino = new Date().toISOString();
        const duracionMinutos = Math.ceil((new Date(fechaTermino) - new Date(ficha.created_at)) / 60000);

        // 1. Actualizar arribo con fecha de termino
        const { error: arriboError } = await supabase
            .from("arribos")
            .update({ fecha_termino: fechaTermino })
            .eq("paciente_id", ficha.paciente_id)
            .is("fecha_termino", null);

        if (arriboError) {
            console.warn("[terminarAtencion] Error actualizando arribo:", arriboError.message);
        } else {
            console.log("[terminarAtencion] Arribo actualizado para paciente:", ficha.paciente_id);
        }

        // 2. Actualizar ficha con estado FINALIZADA
        const { error: fichaUpdateError } = await supabase
            .from("fichas")
            .update({
                finished_at: fechaTermino
            })
            .eq("id", ficha.id);

        if (fichaUpdateError) {
            console.error("[terminarAtencion] Error actualizando ficha:", fichaUpdateError.message);
            return NextResponse.json({ error: "Error actualizando ficha" }, { status: 500 });
        }
        console.log("[terminarAtencion] Ficha actualizada como TERMINADA:", ficha.id);

        // 3. Finalizar atención en box y liberar
        const { data: boxUpdate, error: boxError } = await supabase
            .from("boxes")
            .update({
                termino_atencion: fechaTermino,
                paciente_id: null,
                profesional_id: null
            })
            .eq("paciente_id", ficha.paciente_id)
            .eq("profesional_id", profesional.id);

        if (!boxUpdate || boxError) {
            console.warn("[terminarAtencion] Error liberando box:", boxError);
        } else {
            console.log("[terminarAtencion] Box liberado para paciente:", ficha.paciente_id);
        }

        return NextResponse.json({ ok: true, message: "Atención terminada correctamente" });
    } catch (error) {
        console.error("[terminarAtencion] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
