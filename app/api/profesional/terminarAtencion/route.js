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
            .eq("user_id", usuario.id)
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
            .gte("created_at", hoy.toISOString())
            .lt("created_at", manana.toISOString())
            .is("finished_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (fichaError || !ficha) {
            console.warn("[terminarAtencion] No se encontró ficha para el profesional");
            return NextResponse.json({ error: "No se encontró ficha activa" }, { status: 404 });
        }

        console.log("[terminarAtencion] Ficha encontrada:", ficha.id);

        const fechaTermino = new Date().toISOString();
        const duracionMinutos = Math.ceil((new Date(fechaTermino) - new Date(ficha.created_at)) / 60000);

        // 1. Actualizar arribo con fecha de retiro
        const { error: arriboError } = await supabase
            .from("arribos")
            .update({ fecha_retiro: fechaTermino })
            .eq("paciente_id", ficha.paciente_id)
            .is("fecha_retiro", null);

        if (arriboError) {
            console.warn("[terminarAtencion] Error actualizando arribo:", arriboError.message);
        } else {
            console.log("[terminarAtencion] Arribo actualizado para paciente:", ficha.paciente_id);
        }

        // 2. Actualizar ficha con estado FINALIZADA
        const { error: fichaUpdateError } = await supabase
            .from("fichas")
            .update({
                finished_at: fechaTermino,
                duracion_minutos: duracionMinutos
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
                ocupado: false,
                paciente_id: null,
                profesional_id: null
            })
            .eq("paciente_id", ficha.paciente_id)
            .eq("profesional_id", profesional.id)
            .eq("ocupado", true);

        if (!boxUpdate || boxError) {
            console.warn("[terminarAtencion] Error liberando box:", boxError.message);
        } else {
            console.log("[terminarAtencion] Box liberado para paciente:", ficha.paciente_id);
        }

        // 4. Crear snapshot en historial (opcional - si existe tabla historial_pacientes)
        await crearSnapshotConsulta(supabase, ficha.paciente_id, usuario.id, profesional.id, ficha.id);

        return NextResponse.json({ ok: true, message: "Atención terminada correctamente" });

    } catch (error) {
        console.error("[terminarAtencion] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// Función para crear snapshot completo de la consulta
async function crearSnapshotConsulta(supabase, pacienteId, usuarioId, profesionalId, fichaId) {
    try {
        // Obtener el paciente actual para crear snapshot completo
        const { data: paciente, error: pacienteError } = await supabase
            .from("pacientes")
            .select(`
                id, nombres, apellidos, numero_identidad, email,
                fecha_nacimiento, genero, nombre_social, grupo_sanguineo,
                direccion, telefono, sistema_salud_id, alergias, operaciones
            `)
            .eq("id", pacienteId)
            .single();

        if (pacienteError || !paciente) {
            console.warn("[crearSnapshotConsulta] Paciente no encontrado:", pacienteId);
            return;
        }

        // Obtener la ficha para información de la consulta
        const { data: ficha, error: fichaError } = await supabase
            .from("fichas")
            .select("id, tratamiento, examenes, created_at, finished_at")
            .eq("id", fichaId)
            .single();

        if (fichaError || !ficha) {
            console.warn("[crearSnapshotConsulta] Ficha no encontrada:", fichaId);
            return;
        }

        // Obtener información del profesional
        const { data: profesional } = await supabase
            .from("profesionales")
            .select(`
                id,
                especialidades:profesional_especialidades (
                    especialidad:especialidades ( nombre )
                )
            `)
            .eq("id", profesionalId)
            .single();

        const especialidad = profesional?.especialidades?.[0]?.especialidad?.nombre || 'Sin asignar';

        // Crear el snapshot en historial_pacientes (si existe la tabla)
        const { error: historialError } = await supabase
            .from("historial_pacientes")
            .insert({
                ficha_id: fichaId,
                paciente_id: pacienteId,
                profesional_id: profesionalId,
                usuario_id: usuarioId,
                nombres: paciente.nombres,
                apellidos: paciente.apellidos,
                numero_identidad: paciente.numero_identidad,
                email: paciente.email,
                fecha_nacimiento: paciente.fecha_nacimiento,
                genero: paciente.genero,
                sistema_salud_id: paciente.sistema_salud_id,
                alergias: paciente.alergias,
                operaciones: paciente.operaciones,
                tratamiento: ficha.tratamiento,
                examenes: ficha.examenes,
                especialidad: especialidad,
                tipo_operacion: 'CONSULTA_FINALIZADA',
                fecha_atencion: new Date().toISOString(),
                observaciones: `Snapshot de consulta finalizada el ${new Date().toLocaleDateString('es-CL')}`
            });

        if (historialError) {
            // No interrumpir el flujo si falla el historial
            console.warn("[crearSnapshotConsulta] Error creando snapshot:", historialError.message);
        } else {
            console.log(`[crearSnapshotConsulta] Snapshot creado para paciente ${paciente.numero_identidad} - Ficha ${fichaId}`);
        }

    } catch (error) {
        console.error("[crearSnapshotConsulta] Error creando snapshot:", error);
    }
}