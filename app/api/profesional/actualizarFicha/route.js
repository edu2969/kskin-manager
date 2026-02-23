import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

// Configuración de parsing para campos específicos
const FIELD_PARSERS = {
    // Campos numéricos (SMALLINT/INTEGER)
    'sistema_salud_id': { type: 'integer' },
    'cantidad_cigarrillos_semanales': { type: 'integer' },
    'agua_consumida_diaria_litros': { type: 'numeric' },
    'horas_ejercicio_semanales': { type: 'numeric' },
    'duracion_tratamiento_semanas': { type: 'integer' },
    
    // Campos de fecha
    'fecha_nacimiento': { type: 'date' },
    'fecha': { type: 'date' },
    
    // Campos booleanos
    'ocupado': { type: 'boolean' },
    'abortado': { type: 'boolean' }
};

// Función para parsear valores según el tipo de campo
function parseFieldValue(fieldName, value) {
    const parser = FIELD_PARSERS[fieldName];
    
    if (!parser) {
        return value; // Sin parsing, devolver valor original
    }
    
    // Si el valor es null, undefined o string vacío, devolver null
    if (value === null || value === undefined || value === '') {
        return null;
    }
    
    switch (parser.type) {
        case 'integer':
            const intValue = parseInt(value, 10);
            return isNaN(intValue) ? null : intValue;
            
        case 'numeric':
            const numValue = parseFloat(value);
            return isNaN(numValue) ? null : numValue;
            
        case 'date':
            if (typeof value === 'string') {
                const dateObj = new Date(value);
                return isNaN(dateObj.getTime()) ? null : value; // Mantener string si es válido
            }
            return value;
            
        case 'boolean':
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true';
            }
            return Boolean(value);
            
        default:
            return value;
    }
}

export async function POST(req) {
    try {
        console.log("[actualizarFicha] Iniciando petición");

        const { user } = await getAuthenticatedUser();
        if (!user) {
            console.warn("[actualizarFicha] No autorizado");
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: usuario, error: userError } = await supabase
            .from("usuarios")
            .select("id, rol, email")
            .eq("id", user.id)
            .single();

        if (userError || !usuario || (usuario.rol !== USER_ROLE.profesional && usuario.rol !== USER_ROLE.recepcionista)) {
            console.warn("[actualizarFicha] Acceso denegado para usuario:", usuario?.email);
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const body = await req.json();
        const { fichaId, pacienteId, changes } = body;
        console.log("[actualizarFicha] Body recibido:", body);

        if ((!pacienteId && !fichaId) || !changes || typeof changes !== 'object') {
            console.warn("[actualizarFicha] pacienteId/fichaId o changes faltante");
            return NextResponse.json({ error: "pacienteId y changes requeridos" }, { status: 400 });
        }

        // Buscar ficha aktiva
        let fichaActual = null;
        if (fichaId) {
            const { data: ficha } = await supabase
                .from("fichas")
                .select("id, higiene_id, paciente_id")
                .eq("id", fichaId)
                .single();
            fichaActual = ficha;
        } else {
            // Buscar ficha del día
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(hoy.getDate() + 1);

            const { data: ficha } = await supabase
                .from("fichas")
                .select("id, higiene_id, paciente_id")
                .eq("paciente_id", pacienteId)
                .gte("created_at", hoy.toISOString())
                .lt("created_at", manana.toISOString())
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            fichaActual = ficha;
        }        

        // Categorizar y aplicar cambios
        const pacienteUpdates = {};
        const fichaUpdates = {};
        const higieneUpdates = {};

        const pacienteFields = [
            'nombres', 'apellidos', 'numero_identidad', 'email', 'fecha_nacimiento', 'genero', 
            'nombre_social', 'direccion', 'telefono', 'sistema_salud_id', 'alergias', 'operaciones'
        ];

        const fichaFields = [
            'anamnesis', 'tratamiento', 'examenes', 'receta', 'duracion_tratamiento_semanas'            
        ];

        const higieneFields = [
            'cantidad_cigarrillos_semanales', 'agua_consumida_diaria_litros', 'horas_ejercicio_semanales',
            'nivel_estres', 'calidad_dormir', 'habito_alimenticio'
        ];

        Object.entries(changes).forEach(([fieldPath, value]) => {
            // Convertir fieldPath tipo "paciente.nombres" o "higiene.nivelEstres"
            const [categoria, campo] = fieldPath.includes('.') ? fieldPath.split('.') : ['ficha', fieldPath];
            
            // Parsear valor según el tipo de campo
            const parsedValue = parseFieldValue(campo, value);
            
            if (categoria === 'paciente' && pacienteFields.includes(campo)) {
                pacienteUpdates[campo] = parsedValue;
            } else if (categoria === 'higiene' && higieneFields.includes(campo)) {
                higieneUpdates[campo] = parsedValue;
            } else if (fichaFields.includes(campo) || categoria === 'ficha') {
                fichaUpdates[campo] = parsedValue;
            }
        });

        // Aplicar actualizaciones
        const updatePromises = [];

        console.log("[actualizarFicha] ids:", pacienteId, fichaActual);

        if (Object.keys(pacienteUpdates).length > 0) {
            updatePromises.push(
                supabase
                    .from("pacientes")
                    .update({ ...pacienteUpdates })
                    .eq("id", pacienteId || fichaActual?.paciente_id)
            );
        }

        if (Object.keys(fichaUpdates).length > 0 && fichaActual) {
            updatePromises.push(
                supabase
                    .from("fichas")
                    .update({ ...fichaUpdates })
                    .eq("id", fichaActual.id)
            );
        }

        if (Object.keys(higieneUpdates).length > 0 && fichaActual) {
            if (fichaActual.higiene_id) {
                // Actualizar higiene existente
                updatePromises.push(
                    supabase
                        .from("higienes")
                        .update({ ...higieneUpdates })
                        .eq("id", fichaActual.higiene_id)
                );
            } else {
                // Crear nueva entrada de higiene y asociarla a la ficha
                updatePromises.push(
                    supabase
                        .from("higienes")
                        .insert(higieneUpdates)
                        .select("id")
                        .single()
                        .then(({ data: higiene, error }) => {
                            if (!error && higiene) {
                                return supabase
                                    .from("fichas")
                                    .update({ higiene_id: higiene.id })
                                    .eq("id", fichaActual.id);
                            }
                            return { error };
                        })
                );
            }
        }

        const results = await Promise.all(updatePromises);
        const errors = results.filter(result => result.error);

        if (errors.length > 0) {
            console.error("[actualizarFicha] Errores en actualizaciones:", errors);
            return NextResponse.json({ 
                error: "Error actualizando algunos campos",
                details: errors.map(e => e.error.message)
            }, { status: 500 });
        }

        console.log("[actualizarFicha] Actualizaciones aplicadas correctamente");
        return NextResponse.json({ ok: true, updatedFields: Object.keys(changes) });

    } catch (error) {
        console.error("[actualizarFicha] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}