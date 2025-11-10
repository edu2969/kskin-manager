import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import Paciente from "@/models/paciente";
import HistorialPaciente from "@/models/historialPaciente";
import Ficha from "@/models/ficha";

export async function POST(req) {
    await connectMongoDB();
    console.log("[crearSnapshotPaciente] Conexión a MongoDB establecida");

    const session = await getServerSession(authOptions);
    console.log("[crearSnapshotPaciente] Sesión obtenida:", session ? session.user?.email : "No session");

    if (!session || !session.user) {
        console.warn("[crearSnapshotPaciente] No autorizado");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    console.log("[crearSnapshotPaciente] Usuario encontrado:", user ? user.email : "No user");

    if (!user || (user.role !== USER_ROLE.profesional && user.role !== USER_ROLE.recepcionista)) {
        console.warn("[crearSnapshotPaciente] Acceso denegado para usuario:", user ? user.email : "No user");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await req.json();
    const { pacienteId, fichaId, motivo, observaciones } = body;

    if (!pacienteId) {
        console.warn("[crearSnapshotPaciente] pacienteId requerido");
        return NextResponse.json({ error: "pacienteId requerido" }, { status: 400 });
    }

    try {
        await crearSnapshotPaciente(pacienteId, user._id, null, fichaId, motivo, observaciones);
        console.log("[crearSnapshotPaciente] Snapshot creado exitosamente");

        return NextResponse.json({ 
            ok: true, 
            message: "Snapshot del paciente creado correctamente" 
        });

    } catch (error) {
        console.error("[crearSnapshotPaciente] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// Función para crear snapshot de paciente sin profesional asignado
async function crearSnapshotPaciente(pacienteId, usuarioId, profesionalId = null, fichaId = null, motivo = 'REGISTRO_INICIAL', observaciones = '') {
    try {
        // Obtener el paciente actual para crear snapshot completo
        const paciente = await Paciente.findById(pacienteId).lean();
        if (!paciente) {
            console.warn("[crearSnapshotPaciente] Paciente no encontrado:", pacienteId);
            throw new Error("Paciente no encontrado");
        }

        // Obtener la ficha si se proporciona
        let ficha = null;
        if (fichaId) {
            ficha = await Ficha.findById(fichaId).lean();
        }

        // Crear el snapshot completo
        await HistorialPaciente.create({
            // ID de la ficha asociada (puede ser null para registros iniciales)
            fichaId: fichaId || null,
            
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
            
            // Información de la consulta (snapshot de la ficha si existe)
            anamnesis: ficha?.anamnesis || null,
            solicitudExamenes: ficha?.solicitudExamenes || [],
            indicaciones: ficha?.indicaciones || null,
            recetas: ficha?.recetas || [],
            
            // Metadatos
            profesionalId: profesionalId, // Puede ser null
            usuarioId: usuarioId,
            fechaAtencion: new Date(),
            especialidad: 'Sin asignar', // No hay profesional
            tipoOperacion: motivo || 'REGISTRO_INICIAL',
            observaciones: observaciones || `Snapshot de paciente creado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}`
        });

        console.log(`[crearSnapshotPaciente] Snapshot creado para paciente ${paciente.rut} - Motivo: ${motivo}`);

    } catch (error) {
        console.error("[crearSnapshotPaciente] Error creando snapshot:", error);
        throw error;
    }
}

export { crearSnapshotPaciente };