import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

const FIELD_PARSERS = {
    // Campos numéricos (SMALLINT/INTEGER)
    'sistema_salud_id': { type: 'integer' },
    'cantidad_cigarrillos_semanales': { type: 'integer' },
    'agua_consumida_diaria_litros': { type: 'numeric' },
    'horas_ejercicio_semanales': { type: 'numeric' },
    'duracion_tratamiento_semanas': { type: 'integer' },
    'numero': { type: 'integer' }, // ✅ NUEVO: Para número de parto
    
    // Campos de fecha
    'fecha_nacimiento': { type: 'date' },
    'fecha': { type: 'date' },
    'fecha_desde': { type: 'date' }, // ✅ NUEVO: Para fechas de anticonceptivos
    'fecha_hasta': { type: 'date' }, // ✅ NUEVO: Para fechas de anticonceptivos
    
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

function normalizeMedicationName(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().replace(/\s+/g, " ");
}

export async function POST(req) {
    try {
        console.log("[actualizarFicha] Iniciando petición");
        
        const supabase = await getSupabaseServerClient();
        const { data: user } = await getAuthenticatedUser();
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
                .select("id, paciente_id, higiene_id")
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
                .select("id, paciente_id, higiene_id")
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
        const partosOperations = []; // Para operaciones de partos
        const anticonceptivosOperations = []; // Para operaciones de anticonceptivos
        const medicamentosOperations = []; // Para operaciones de ficha_medicamentos

        const pacienteFields = [
            'nombres', 'apellidos', 'numero_identidad', 'email', 'fecha_nacimiento', 'genero', 
            'nombre_social', 'direccion', 'telefono', 'sistema_salud_id', 'aplica_alergias', 'alergias', 
            'operaciones', 'otro_anticonceptivo', 'otro_medicamento', 'otro_antecedente', 
            'antecedentes_adicionales', 'ocupacion'
        ];

        const fichaFields = [
            'anamnesis', 'tratamiento', 'motivo_consulta', 
            'receta', 'duracion_tratamiento_semanas'            
        ];

        const higieneFields = [
            'cantidad_cigarrillos_semanales', 'agua_consumida_diaria_litros', 'horas_ejercicio_semanales',
            'nivel_estres', 'calidad_dormir', 'habito_alimenticio'
        ];

        // Obtener partos actuales de la tabla separada (solo para logging si es necesario)
        const { data: partosActuales, error: partosError } = await supabase
            .from("paciente_partos")
            .select("*")
            .eq("paciente_id", pacienteId || fichaActual?.paciente_id);

        if (partosError) {
            console.error("[actualizarFicha] Error obteniendo partos:", partosError);
        }

        Object.entries(changes).forEach(([fieldPath, value]) => {
            // Manejar comando de eliminación de partos
            if (fieldPath.startsWith('paciente.parto.delete.')) {
                const match = fieldPath.match(/^paciente\.parto\.delete\.([^\.]+)$/);
                if (match) {
                    const [, partoId] = match;
                    console.log("[actualizarFicha] Marcando parto para eliminar:", partoId);
                    partosOperations.push({
                        type: 'delete',
                        partoId,
                        paciente_id: pacienteId || fichaActual?.paciente_id
                    });
                }
                return; // Skip el procesamiento normal
            }

            // Manejar comando de eliminación de anticonceptivos
            if (fieldPath.startsWith('paciente.anticonceptivo.delete.')) {
                const match = fieldPath.match(/^paciente\.anticonceptivo\.delete\.([^\.]+)$/);
                if (match) {
                    const [, anticonceptivoId] = match;
                    console.log("[actualizarFicha] Marcando anticonceptivo para eliminar:", anticonceptivoId);
                    // Solo eliminar si el ID no es un "new_" temporal
                    if (!anticonceptivoId.startsWith('new_')) {
                        anticonceptivosOperations.push({
                            type: 'delete',
                            anticonceptivoId,
                            paciente_id: pacienteId || fichaActual?.paciente_id
                        });
                    }
                }
                return; // Skip el procesamiento normal
            }

            // Manejar comando de eliminación de medicamentos de ficha
            if (fieldPath.startsWith('ficha.medicamento.delete.')) {
                const match = fieldPath.match(/^ficha\.medicamento\.delete\.([^\.]+)$/);
                if (match) {
                    const [, medicamentoId] = match;
                    console.log("[actualizarFicha] Marcando medicamento para eliminar:", medicamentoId);
                    medicamentosOperations.push({
                        type: 'delete',
                        medicamentoId
                    });
                }
                return;
            }

            // Manejar campos de medicamentos de ficha
            if (fieldPath.startsWith('ficha.medicamento.')) {
                const match = fieldPath.match(/^ficha\.medicamento\.([^\.]+)\.(\w+)$/);
                if (match) {
                    const [, medicamentoTempId, campo] = match;
                    console.log("[actualizarFicha] Procesando medicamento:", medicamentoTempId, campo, value);

                    const camposValidos = ['medicamento_id', 'dosis_prescrita', 'frecuencia', 'duracion'];
                    if (!camposValidos.includes(campo)) {
                        console.log("[actualizarFicha] Campo de medicamento no válido:", campo);
                        return;
                    }

                    let parsedValue = parseFieldValue(campo, value);
                    if (campo === 'medicamento_id' && typeof value === 'string') {
                        parsedValue = value.trim();
                        if (!parsedValue) {
                            return;
                        }
                    }

                    medicamentosOperations.push({
                        type: 'upsert',
                        medicamentoTempId,
                        field: campo,
                        value: parsedValue
                    });
                }
                return;
            }

            // Compatibilidad con input legado de medicamentos como texto libre
            if (fieldPath === 'paciente.medicamentos') {
                const medicationNames = String(value || '')
                    .split(/[\n,;]/)
                    .map(normalizeMedicationName)
                    .filter(Boolean);

                medicamentosOperations.push({
                    type: 'sync_text',
                    medicationNames
                });
                return;
            }

            // Manejar campos de anticonceptivos especialmente
            if (fieldPath.startsWith('paciente.anticonceptivo.')) {
                const match = fieldPath.match(/^paciente\.anticonceptivo\.([^\.]+)\.(\w+)$/);
                if (match) {
                    const [, anticonceptivoId, campo] = match;
                    console.log("[actualizarFicha] Procesando anticonceptivo:", anticonceptivoId, campo, value);
                    
                    // Solo procesar campos que existen en la tabla
                    const camposValidos = ['metodo_anticonceptivo_id'];
                    if (!camposValidos.includes(campo)) {
                        console.log("[actualizarFicha] Campo no válido:", campo);
                        return; // Skip campos no válidos
                    }
                    
                    // Preparar la operación de anticonceptivo
                    let parsedValue = parseFieldValue(campo, value);
                    
                    // Para el campo metodo_anticonceptivo_id, convertir a entero
                    if (campo === 'metodo_anticonceptivo_id') {
                        parsedValue = parseInt(value, 10);
                        if (isNaN(parsedValue) || parsedValue <= 0) {
                            console.log("[actualizarFicha] ID de método anticonceptivo inválido:", value);
                            return;
                        }
                    }
                    
                    anticonceptivosOperations.push({
                        type: 'upsert',
                        anticonceptivoId,
                        field: campo,
                        value: parsedValue,
                        paciente_id: pacienteId || fichaActual?.paciente_id
                    });
                }
                return; // Skip el procesamiento normal
            }
            if (fieldPath.startsWith('paciente.parto.')) {
                const match = fieldPath.match(/^paciente\.parto\.([^\.]+)\.(\w+)$/);
                if (match) {
                    const [, partoId, campo] = match;
                    console.log("[actualizarFicha] Procesando parto:", partoId, campo, value);
                    
                    // Solo procesar campos que existen en la tabla
                    const camposValidos = ['fecha', 'tipo', 'genero'];
                    if (!camposValidos.includes(campo)) {
                        console.log("[actualizarFicha] Campo no válido:", campo);
                        return; // Skip campos no válidos
                    }
                    
                    // Preparar la operación de parto
                    let parsedValue = parseFieldValue(campo, value);
                    
                    // Para el campo tipo, usar directamente el valor del enum
                    if (campo === 'tipo') {
                        // Los valores válidos son: 'normal', 'cesarea', 'aborto'
                        parsedValue = value;
                    }
                    
                    partosOperations.push({
                        type: 'upsert',
                        partoId,
                        field: campo,
                        value: parsedValue,
                        paciente_id: pacienteId || fichaActual?.paciente_id
                    });
                }
                return; // Skip el procesamiento normal
            }

            // Procesamiento normal para otros campos
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

        console.log("[actualizarFicha] Operaciones de partos después del forEach:", partosOperations);
        console.log("[actualizarFicha] Operaciones de anticonceptivos después del forEach:", anticonceptivosOperations);
        console.log("[actualizarFicha] Operaciones de medicamentos después del forEach:", medicamentosOperations);

        const updatePromises = [];

        console.log("[actualizarFicha] ids:", pacienteId, fichaActual);

        // Actualizaciones de paciente (sin partos)
        if (Object.keys(pacienteUpdates).length > 0) {
            updatePromises.push(
                supabase
                    .from("pacientes")
                    .update(pacienteUpdates)
                    .eq("id", pacienteId || fichaActual?.paciente_id)
            );
        }

        // Manejar operaciones de medicamentos por relación ficha_medicamentos
        if (medicamentosOperations.length > 0 && fichaActual?.id) {
            console.log("[actualizarFicha] Procesando operaciones de medicamentos:", medicamentosOperations);

            const deleteMedicamentos = medicamentosOperations.filter(op => op.type === 'delete');
            const upsertMedicamentos = medicamentosOperations.filter(op => op.type === 'upsert');
            const syncTextOperation = medicamentosOperations.find(op => op.type === 'sync_text');

            deleteMedicamentos.forEach(op => {
                if (!op.medicamentoId.startsWith('new_')) {
                    updatePromises.push(
                        supabase
                            .from('ficha_medicamentos')
                            .delete()
                            .eq('ficha_id', fichaActual.id)
                            .eq('medicamento_id', op.medicamentoId)
                    );
                }
            });

            if (upsertMedicamentos.length > 0) {
                const grouped = {};

                upsertMedicamentos.forEach(op => {
                    if (!grouped[op.medicamentoTempId]) {
                        grouped[op.medicamentoTempId] = {};
                    }
                    grouped[op.medicamentoTempId][op.field] = op.value;
                });

                Object.values(grouped).forEach((medData) => {
                    if (!medData.medicamento_id) {
                        return;
                    }

                    updatePromises.push(
                        supabase
                            .from('ficha_medicamentos')
                            .upsert({
                                ficha_id: fichaActual.id,
                                medicamento_id: medData.medicamento_id,
                                dosis_prescrita: medData.dosis_prescrita || null,
                                frecuencia: medData.frecuencia || null,
                                duracion: medData.duracion || null
                            }, {
                                onConflict: 'ficha_id,medicamento_id'
                            })
                    );
                });
            }

            // Soporte de compatibilidad para payload legado basado en texto libre
            if (syncTextOperation && Array.isArray(syncTextOperation.medicationNames)) {
                const uniqueNames = [...new Set(syncTextOperation.medicationNames.map(normalizeMedicationName).filter(Boolean))];

                const { data: existingLinks, error: existingLinksError } = await supabase
                    .from('ficha_medicamentos')
                    .select('medicamento_id')
                    .eq('ficha_id', fichaActual.id);

                if (existingLinksError) {
                    return NextResponse.json({
                        error: 'Error obteniendo medicamentos actuales de la ficha',
                        details: [existingLinksError.message]
                    }, { status: 500 });
                }

                let targetMedicationIds = [];

                if (uniqueNames.length > 0) {
                    const { data: existingMeds, error: existingMedsError } = await supabase
                        .from('medicamentos')
                        .select('id, nombre')
                        .in('nombre', uniqueNames);

                    if (existingMedsError) {
                        return NextResponse.json({
                            error: 'Error obteniendo medicamentos por nombre',
                            details: [existingMedsError.message]
                        }, { status: 500 });
                    }

                    const existingByName = new Map((existingMeds || []).map((m) => [normalizeMedicationName(m.nombre), m.id]));
                    const missingNames = uniqueNames.filter((name) => !existingByName.has(name));

                    if (missingNames.length > 0) {
                        const { data: insertedMeds, error: insertMedsError } = await supabase
                            .from('medicamentos')
                            .insert(missingNames.map((nombre) => ({ nombre })))
                            .select('id, nombre');

                        if (insertMedsError) {
                            return NextResponse.json({
                                error: 'Error creando medicamentos faltantes',
                                details: [insertMedsError.message]
                            }, { status: 500 });
                        }

                        (insertedMeds || []).forEach((m) => {
                            existingByName.set(normalizeMedicationName(m.nombre), m.id);
                        });
                    }

                    targetMedicationIds = uniqueNames
                        .map((name) => existingByName.get(name))
                        .filter(Boolean);
                }

                const currentMedicationIds = (existingLinks || []).map((row) => row.medicamento_id);
                const toDelete = currentMedicationIds.filter((id) => !targetMedicationIds.includes(id));
                const toInsert = targetMedicationIds.filter((id) => !currentMedicationIds.includes(id));

                if (toDelete.length > 0) {
                    updatePromises.push(
                        supabase
                            .from('ficha_medicamentos')
                            .delete()
                            .eq('ficha_id', fichaActual.id)
                            .in('medicamento_id', toDelete)
                    );
                }

                if (toInsert.length > 0) {
                    updatePromises.push(
                        supabase
                            .from('ficha_medicamentos')
                            .insert(toInsert.map((medicamento_id) => ({
                                ficha_id: fichaActual.id,
                                medicamento_id
                            })))
                    );
                }
            }
        }

        // Manejar operaciones de partos
        if (partosOperations.length > 0) {
            console.log("[actualizarFicha] Procesando operaciones de partos:", partosOperations);
            
            // Separar operaciones de eliminación y upsert
            const deleteOperations = partosOperations.filter(op => op.type === 'delete');
            const upsertOperations = partosOperations.filter(op => op.type === 'upsert');

            // Ejecutar eliminaciones primero
            deleteOperations.forEach(op => {
                if (!op.partoId.startsWith('new_')) {
                    console.log("[actualizarFicha] Eliminando parto:", op.partoId);
                    updatePromises.push(
                        supabase
                            .from("paciente_partos")
                            .delete()
                            .eq("id", op.partoId)
                    );
                }
            });

            // Agrupar operaciones upsert por ID de parto
            const partosGrouped = {};
            upsertOperations.forEach(op => {
                if (!partosGrouped[op.partoId]) {
                    partosGrouped[op.partoId] = {};
                }
                partosGrouped[op.partoId][op.field] = op.value;
            });

            console.log("[actualizarFicha] Partos agrupados:", partosGrouped);

            // Ejecutar upserts para cada parto
            Object.entries(partosGrouped).forEach(([partoId, partoData]) => {
                if (partoId.startsWith('new_')) {
                    // Crear nuevo parto - aquí SÍ incluir paciente_id
                    const newPartoData = { ...partoData, paciente_id: pacienteId || fichaActual?.paciente_id };
                    console.log("[actualizarFicha] Creando nuevo parto:", newPartoData);
                    updatePromises.push(
                        supabase
                            .from("paciente_partos")
                            .insert(newPartoData)
                    );
                } else {
                    // Actualizar parto existente por ID - NO incluir paciente_id
                    console.log("[actualizarFicha] Actualizando parto:", partoId, partoData);
                    updatePromises.push(
                        supabase
                            .from("paciente_partos")
                            .update(partoData)
                            .eq("id", partoId)
                    );
                }
            });
        }

        // Manejar operaciones de anticonceptivos
        if (anticonceptivosOperations.length > 0) {
            console.log("[actualizarFicha] Procesando operaciones de anticonceptivos:", anticonceptivosOperations);
            
            // Separar operaciones de eliminación y upsert
            const deleteAnticonceptivos = anticonceptivosOperations.filter(op => op.type === 'delete');
            const upsertAnticonceptivos = anticonceptivosOperations.filter(op => op.type === 'upsert');

            // Ejecutar eliminaciones primero
            deleteAnticonceptivos.forEach(op => {
                // Solo eliminar registros que existen en la BD (no los temporales "new_")
                if (!op.anticonceptivoId.startsWith('new_')) {
                    console.log("[actualizarFicha] Eliminando anticonceptivo:", op.anticonceptivoId);
                    updatePromises.push(
                        supabase
                            .from("paciente_metodo_anticonceptivo")
                            .delete()
                            .eq("id", op.anticonceptivoId)
                    );
                }
            });

            // Agrupar operaciones upsert por ID de anticonceptivo
            const anticonceptivosGrouped = {};
            upsertAnticonceptivos.forEach(op => {
                if (!anticonceptivosGrouped[op.anticonceptivoId]) {
                    anticonceptivosGrouped[op.anticonceptivoId] = {};
                }
                anticonceptivosGrouped[op.anticonceptivoId][op.field] = op.value;
            });

            console.log("[actualizarFicha] Anticonceptivos agrupados:", anticonceptivosGrouped);

            // Ejecutar upserts para cada anticonceptivo
            Object.entries(anticonceptivosGrouped).forEach(([anticonceptivoId, anticonceptivoData]) => {
                if (anticonceptivoId.startsWith('new_')) {
                    // Crear nuevo anticonceptivo - solo incluir campos necesarios
                    const newAnticonceptivoData = { 
                        metodo_anticonceptivo_id: anticonceptivoData.metodo_anticonceptivo_id,
                        paciente_id: pacienteId || fichaActual?.paciente_id 
                    };
                    console.log("[actualizarFicha] Creando nuevo anticonceptivo:", newAnticonceptivoData);
                    updatePromises.push(
                        supabase
                            .from("paciente_metodo_anticonceptivo")
                            .insert(newAnticonceptivoData)
                    );
                } else {
                    // Actualizar anticonceptivo existente por ID - NO incluir paciente_id
                    console.log("[actualizarFicha] Actualizando anticonceptivo:", anticonceptivoId, anticonceptivoData);
                    console.log("[actualizarFicha] Tipo de anticonceptivoId:", typeof anticonceptivoId, "Es UUID:", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(anticonceptivoId));
                    updatePromises.push(
                        supabase
                            .from("paciente_metodo_anticonceptivo")
                            .update(anticonceptivoData)
                            .eq("id", anticonceptivoId)
                    );
                }
            });
        }

        if (Object.keys(fichaUpdates).length > 0 && fichaActual) {
            updatePromises.push(
                supabase
                    .from("fichas")
                    .update({ ...fichaUpdates })
                    .eq("id", fichaActual.id)
            );
        }

        if (Object.keys(higieneUpdates).length > 0 && fichaActual?.id) {
            // Relación confirmada: fichas.higiene_id -> higienes.id (nullable)
            if (fichaActual.higiene_id) {
                updatePromises.push(
                    supabase
                        .from("higienes")
                        .update({ ...higieneUpdates })
                        .eq("id", fichaActual.higiene_id)
                );
            } else {
                const { data: nuevaHigiene, error: insertHigieneError } = await supabase
                    .from("higienes")
                    .insert({ ...higieneUpdates })
                    .select("id")
                    .single();

                if (insertHigieneError || !nuevaHigiene?.id) {
                    return NextResponse.json({
                        error: "Error creando higiene",
                        details: [insertHigieneError?.message || "No se pudo crear el registro de higiene"]
                    }, { status: 500 });
                }

                updatePromises.push(
                    supabase
                        .from("fichas")
                        .update({ higiene_id: nuevaHigiene.id })
                        .eq("id", fichaActual.id)
                );
            }
        }

        const results = await Promise.all(updatePromises);
        console.log("[actualizarFicha] Resultados de todas las operaciones:", results.map((r,i) => ({
            index: i,
            data: r.data,
            error: r.error,
            count: r.count,
            status: r.status
        })));
        
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
