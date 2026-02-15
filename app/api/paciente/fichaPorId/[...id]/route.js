import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

// Initialize Supabase client

export async function GET(req, { params }) {
    try {
        console.log("[GET] /api/paciente/historico - Iniciando petición");

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Ficha ID is required' }, { status: 400 });
        }

        const { user } = await getAuthenticatedUser();
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
                    fecha_nacimiento,
                    genero,
                    sistema_salud_id,
                    alergias,
                    antecedentes_adicionales,
                    antecedentes:paciente_antecedentes (
                        antecedente_id:antecedentes (
                            nombre
                        )
                    ),
                    partos:paciente_partos (
                        fecha,
                        tipo,
                        abortado,
                        genero
                    )
                ),
                profesional:profesionales (
                    id,                    
                    usuario:usuarios (
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
                higiene:ficha_higiene (
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
                created_at,
                finished_at
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.log("ERROR", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!ficha) {
            return NextResponse.json({ error: 'Ficha not found' }, { status: 404 });
        }

        // Transform the data to match the IFichaDetalle interface
        const fichaDetalle = {
            id: ficha.id,
            paciente: {
                id: ficha.paciente.id,
                nombres: ficha.paciente.nombres,
                apellidos: ficha.paciente.apellidos,
                numeroIdentidad: ficha.paciente.numero_identidad,
                fechaNacimiento: ficha.paciente.fecha_nacimiento,
                genero: ficha.paciente.genero,
                sistemaSalud: ficha.paciente.sistema_salud,
                aplicaAlergias: ficha.paciente.aplica_alergias,
                alergias: ficha.paciente.alergias ? ficha.paciente.alergias.split(',') : [],
                antecedentes: ficha.paciente.antecedentes?.map((a) => a.detalles),
                medicamentos: ficha.paciente.medicamentos?.map((m) => ({
                    nombre: m.nombre, // Replace with actual name if available
                    unidades: m.dosis_prescrita,
                    frecuencia: m.frecuencia,
                })),
                partos: ficha.paciente.partos,
                higiene: ficha.paciente.higiene,
                antecedentesAdicionales: ficha.paciente.antecedentes_adicionales || null,
            },
            profesional: {
                id: ficha.profesional.id,
                nombre: ficha.profesional.usuario.nombre,
                email: ficha.profesional.usuario.email,
                especialidades: ficha.profesional.especialidades.map((e) => ({
                    nombre: e.especialidad.nombre,
                })),
            },
            fecha: ficha.fecha,
            tratamiento: ficha.tratamiento,
            duracionTratamientoSemanas: ficha.duracion_tratamiento_semanas,
            examenes: ficha.examenes,
            createdAt: ficha.created_at,
            finishedAt: ficha.finished_at,
        };

        // Return the ficha details
        return NextResponse.json(fichaDetalle);
    } catch (err) {
        console.error('Error fetching ficha:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}