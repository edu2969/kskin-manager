import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

// Initialize Supabase client

export async function GET(req) {
    try {
        console.log("[GET] /api/paciente/ficha - Iniciando petición");
        
        const supabase = await getSupabaseServerClient();
        const { searchParams } = req.nextUrl;
        const pacienteId = normalizeQueryParam(searchParams.get("pacienteId"));
        const fichaId = normalizeQueryParam(searchParams.get("fichaId"));

        const filterField = fichaId ? 'id' : 'paciente_id';
        const filterValue = fichaId || pacienteId;
        
        if (!filterValue) {
            return NextResponse.json({ error: 'Paciente ID or Ficha ID is required' }, { status: 400 });
        }

        const { data: user } = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

        // Fetch ficha details from the database
        const { data: ficha, error } = await supabase
            .from('fichas')
            .select(`
                id,
                paciente:pacientes (
                    id,
                    nombres,
                    apellidos,
                    numero_identidad,
                    direccion,
                    email,
                    fecha_nacimiento,
                    telefono,
                    genero,
                    sistemas_salud ( id, nombre ),
                    alergias,
                    antecedentes:paciente_antecedentes ( antecedente_id ),
                    partos:paciente_partos (
                        fecha,
                        tipo,
                        abortado,
                        genero
                    ),                    
                    operaciones
                ),
                profesional:profesionales (
                    id,                    
                    usuario:usuarios (
                        id,
                        nombre,
                        email
                    ),
                    especialidades:profesional_especialidades (
                        especialidad:especialidades (
                            nombre
                        )
                    )
                ),        
                medicamentos:ficha_medicamentos (
                    medicamento_id,
                    dosis_prescrita,
                    frecuencia
                ),
                higiene:higienes (
                    cantidad_cigarrillos_semanales,
                    agua_consumida_diaria_litros,
                    nivel_estres,
                    calidad_dormir,
                    horas_ejercicio_semanales,
                    habito_alimenticio
                ),
                fecha,
                tratamiento,
                duracion_tratamiento_semanas,
                examenes,
                anamnesis,
                created_at,
                finished_at
            `)
            .eq(filterField, filterValue)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
        console.log("[GET] /api/paciente/ficha - fichaId:", fichaId, "pacienteId:", pacienteId);
        console.log("[GET] /api/paciente/ficha - Resultados de la consulta:", filterField, filterValue);

        if (error) {
            console.log("ERROR fetching ficha:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!ficha) {
            return NextResponse.json({ error: 'Ficha not found' }, { status: 404 });
        }

        console.log("Ficha encontrada:", ficha);

        // Transform the data to match the IFichaDetalle interface
        const fichaDetalle = {
            id: ficha.id,
            paciente: {
                id: ficha.paciente.id,
                nombres: ficha.paciente.nombres,
                apellidos: ficha.paciente.apellidos,
                numeroIdentidad: ficha.paciente.numero_identidad,
                direccion: ficha.paciente.direccion,
                email: ficha.paciente.email,
                telefono: ficha.paciente.telefono,
                fechaNacimiento: ficha.paciente.fecha_nacimiento,
                genero: ficha.paciente.genero,
                sistemaSaludId: ficha.paciente.sistemas_salud?.id || 0,
                aplicaAlergias: ficha.paciente.aplica_alergias,
                alergias: ficha.paciente.alergias ? ficha.paciente.alergias.split(',') : [],
                antecedentes: ficha.paciente.antecedentes?.map((a) => a.detalles),
                medicamentos: ficha.paciente.medicamentos?.map((m) => ({
                    nombre: m.nombre, // Replace with actual name if available
                    unidades: m.dosis_prescrita,
                    frecuencia: m.frecuencia,
                })),
                operaciones: ficha.paciente.operaciones,
                partos: ficha.paciente.partos,
                antecedentesAdicionales: ficha.paciente.antecedentes_adicionales || null,
            },
            profesional: {
                id: ficha.profesional.id,
                usuarioId: ficha.profesional.usuario.id,
                nombre: ficha.profesional.usuario.nombre,
                email: ficha.profesional.usuario.email,
                especialidades: ficha.profesional.especialidades.map((e) => ({
                    nombre: e.especialidad.nombre,
                })),
            },
            higiene: {
                cantidadCigarrillosSemanales: ficha.higiene?.cantidad_cigarrillos_semanales,
                aguaConsumidaDiariaLitros: ficha.higiene?.agua_consumida_diaria_litros,
                horasEjercicioSemanales: ficha.higiene?.horas_ejercicio_semanales,
                nivelEstres: ficha.higiene?.nivel_estres,
                calidadDormir: ficha.higiene?.calidad_dormir,
                habitoAlimenticio: ficha.higiene?.habito_alimenticio,
            },
            fecha: ficha.fecha,
            tratamiento: ficha.tratamiento,
            duracionTratamientoSemanas: ficha.duracion_tratamiento_semanas,
            examenes: ficha.examenes,
            anamnesis: ficha.anamnesis,
            createdAt: ficha.created_at,
            finishedAt: ficha.finished_at,
        };
        
        return NextResponse.json(fichaDetalle);
    } catch (err) {
        console.error('Error fetching ficha:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function normalizeQueryParam(value) {
    if (value == null) {
        return null;
    }

    const normalized = String(value).trim();
    if (!normalized) {
        return null;
    }

    const lower = normalized.toLowerCase();
    if (lower === 'null' || lower === 'undefined') {
        return null;
    }

    return normalized;
}