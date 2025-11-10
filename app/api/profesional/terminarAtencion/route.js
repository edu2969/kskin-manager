import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Arribo from "@/models/arribo";
import Box from "@/models/box";
import Ficha from "@/models/ficha";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import Profesional from "@/models/profesional";
import Paciente from "@/models/paciente";
import HistorialPaciente from "@/models/historialPaciente";

export async function POST() {
    await connectMongoDB();
    console.log("[terminarAtencion] Conexión a MongoDB establecida");

    const session = await getServerSession(authOptions);
    console.log("[terminarAtencion] Sesión obtenida:", session ? session.user?.email : "No session");

    if (!session || !session.user) {
        console.warn("[terminarAtencion] No autorizado");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    console.log("[terminarAtencion] Usuario encontrado:", user ? user.email : "No user");

    if (!user || user.role !== USER_ROLE.profesional) {
        console.warn("[terminarAtencion] Acceso denegado para usuario:", user ? user.email : "No user");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const profesional = await Profesional.findOne({ userId: user._id });
    if(!profesional) {
        console.warn("[terminarAtencion] Profesional no encontrado para usuario:", user.email);
        return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    // Buscar la ficha más reciente del profesional que esté siendo editada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const ficha = await Ficha.findOne({
        profesionalId: profesional._id,
        createdAt: { $gte: hoy, $lt: manana }
    }).sort({ createdAt: -1 });

    if (!ficha) {
        console.warn("[terminarAtencion] No se encontró ficha para el profesional");
        return NextResponse.json({ error: "No se encontró ficha activa" }, { status: 404 });
    }

    console.log("[terminarAtencion] Ficha encontrada:", ficha._id);

    const fechaTermino = new Date();

    try {
        // 1. Actualizar arribo con fecha de retiro
        await Arribo.updateOne(
            { 
                pacienteId: ficha.pacienteId,
                profesionalId: profesional._id,
                fechaRetiro: { $exists: false }
            },
            { 
                fechaRetiro: fechaTermino 
            }
        );
        console.log("[terminarAtencion] Arribo actualizado para paciente:", ficha.pacienteId);

        // Paso 2: Actualizar ficha con estado FINALIZADA
        const duracionMinutos = Math.ceil((fechaTermino - ficha.createdAt) / 60000); // Calcular duración en minutos

        await Ficha.updateOne(
            { _id: ficha._id },
            { 
                estadoConsulta: "FINALIZADA",   // ✅ Estado corregido
                horaFin: fechaTermino,          // ✅ Hora de finalización
                duracionMinutos: duracionMinutos      // ✅ Duración total de la consulta
            }
        );
        console.log("[terminarAtencion] Ficha actualizada como TERMINADA:", ficha._id);

        // 3. Finalizar atención en box y liberar
        const boxUpdate = await Box.updateOne(
            { 
                pacienteId: ficha.pacienteId,
                profesionalId: profesional._id,
                'ocupacion.ocupado': true  // ✅ Buscar box actualmente ocupado
            },
            { 
                terminoAtencion: fechaTermino,
                'ocupacion.ocupado': false,
                'ocupacion.fechaCambio': fechaTermino,
                pacienteId: null,
                profesionalId: null
            }
        );
        
        if (boxUpdate.matchedCount === 0) {
            console.warn("[terminarAtencion] No se encontró box ocupado para liberar. Paciente:", ficha.pacienteId, "Profesional:", profesional._id);
        } else {
            console.log("[terminarAtencion] Box liberado para paciente:", ficha.pacienteId, "- Boxes actualizados:", boxUpdate.modifiedCount);
        }

        // 4. Crear snapshot completo de la consulta en el historial
        await crearSnapshotConsulta(ficha.pacienteId, user._id, profesional._id, ficha._id);
        console.log("[terminarAtencion] Snapshot completo de consulta creado");

        return NextResponse.json({ ok: true, message: "Atención terminada correctamente" });

    } catch (error) {
        console.error("[terminarAtencion] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// Función para crear snapshot completo de la consulta
async function crearSnapshotConsulta(pacienteId, usuarioId, profesionalId, fichaId) {
    try {
        // Obtener el paciente actual para crear snapshot completo
        const paciente = await Paciente.findById(pacienteId).lean();
        if (!paciente) {
            console.warn("[crearSnapshotConsulta] Paciente no encontrado:", pacienteId);
            return;
        }

        // Obtener la ficha para información de la consulta
        const ficha = await Ficha.findById(fichaId).lean();
        if (!ficha) {
            console.warn("[crearSnapshotConsulta] Ficha no encontrada:", fichaId);
            return;
        }

        // Obtener información del profesional para especialidad (puede ser null)
        const profesional = profesionalId ? await Profesional.findById(profesionalId).lean() : null;
        
        // Crear el snapshot completo con TODA la información
        await HistorialPaciente.create({
            // ID de la ficha asociada (NUEVO REQUERIMIENTO)
            fichaId: fichaId,
            
            // Información del paciente (snapshot completo)
            nombres: paciente.nombres,
            apellidos: paciente.apellidos,
            rut: paciente.rut,
            email: paciente.email || paciente.correoElectronico,
            fechaNacimiento: paciente.fechaNacimiento,
            genero: paciente.genero,
            nombreSocial: paciente.nombreSocial,
            grupoSanguineo: paciente.grupoSanguineo,
            correoElectronico: paciente.correoElectronico || paciente.email,
            rutResponsable: paciente.rutResponsable,
            direccion: paciente.direccion,
            telefono: paciente.telefono,
            sistemaSalud: paciente.sistemaSalud,
            alergias: paciente.alergias || [],
            
            // Información médica (snapshot)
            antecedenteMorbidoIds: paciente.antecedenteMorbidoIds || [],
            medicamentoIds: paciente.medicamentoIds || [],
            operaciones: paciente.operaciones,
            metodoAnticonceptivos: paciente.metodoAnticonceptivos || [],
            partos: paciente.partos || [],
            higiene: paciente.higiene || {
                fuma: false,
                agua: 0,
                ejercicioSemanal: 0,
                nivelStress: 0,
                calidadDormir: 0,
                habitoAlimenticio: ""
            },
            
            // Información de la consulta (snapshot de la ficha)
            anamnesis: ficha.anamnesis,
            solicitudExamenes: ficha.solicitudExamenes || [],
            indicaciones: ficha.indicaciones,
            recetas: ficha.recetas || [],
            
            // Metadatos
            profesionalId: profesionalId || null, // Puede ser null si no hay profesional asignado
            usuarioId: usuarioId,
            fechaAtencion: new Date(),
            especialidad: profesional?.especialidad || 'Sin asignar',
            tipoOperacion: 'CONSULTA_FINALIZADA',
            observaciones: `Snapshot completo de consulta ${profesional ? 'finalizada' : 'registrada'} el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}`
        });

        console.log(`[crearSnapshotConsulta] Snapshot completo creado para paciente ${paciente.rut} - Ficha ${fichaId}`);

    } catch (error) {
        console.error("[crearSnapshotConsulta] Error creando snapshot:", error);
        // No lanzar error para no interrumpir el flujo de terminar atención
    }
}