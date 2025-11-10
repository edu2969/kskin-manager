import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import HistorialPaciente from "@/models/historialPaciente";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import User from "@/models/user";

export async function GET(req) {
    await connectMongoDB();
    console.log("[historialCambios] Conexión a MongoDB establecida");

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        console.warn("[historialCambios] No autorizado");
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    if (!user || (user.role !== USER_ROLE.profesional && user.role !== USER_ROLE.recepcionista)) {
        console.warn("[historialCambios] Acceso denegado");
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    const limite = parseInt(searchParams.get('limite')) || 50;
    const pagina = parseInt(searchParams.get('pagina')) || 1;
    const tipoOperacion = searchParams.get('tipoOperacion'); // CREACION, ACTUALIZACION, ELIMINACION
    // const campo = searchParams.get('campo'); // Campo específico - TODO: implementar filtro por campo
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    if (!pacienteId) {
        console.warn("[historialCambios] pacienteId requerido");
        return NextResponse.json({ error: "pacienteId requerido" }, { status: 400 });
    }

    try {
        // Buscar por RUT del paciente (nuevo modelo)
        const filtros = { rut: pacienteId }; // Asumiendo que pacienteId es el RUT

        if (tipoOperacion) {
            filtros.tipoOperacion = tipoOperacion;
        }

        if (fechaDesde || fechaHasta) {
            filtros.fechaAtencion = {};
            if (fechaDesde) filtros.fechaAtencion.$gte = new Date(fechaDesde);
            if (fechaHasta) filtros.fechaAtencion.$lte = new Date(fechaHasta);
        }

        // Calcular skip para paginación
        const skip = (pagina - 1) * limite;

        // Consultar historial con paginación (nuevo modelo de snapshots)
        const historial = await HistorialPaciente.find(filtros)
            .populate('usuarioId', 'email name')
            .populate('profesionalId', 'nombres apellidos especialidad')
            .populate('fichaId', 'createdAt motivoConsulta diagnostico')
            .sort({ fechaAtencion: -1 }) // Más recientes primero
            .skip(skip)
            .limit(limite)
            .lean();

        // Contar total para paginación
        const total = await HistorialPaciente.countDocuments(filtros);

        console.log(`[historialCambios] ${historial.length} snapshots encontrados para paciente ${pacienteId}`);

        return NextResponse.json({
            historial,
            paginacion: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite),
                tieneSiguiente: pagina * limite < total,
                tieneAnterior: pagina > 1
            }
        });

    } catch (error) {
        console.error("[historialCambios] Error consultando historial:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Endpoint para obtener resumen de cambios recientes
export async function POST(req) {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    if (!user || (user.role !== USER_ROLE.profesional && user.role !== USER_ROLE.recepcionista)) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await req.json();
    const { pacienteId, ultimosMinutos = 60 } = body;

    if (!pacienteId) {
        return NextResponse.json({ error: "pacienteId requerido" }, { status: 400 });
    }

    try {
        const fechaLimite = new Date();
        fechaLimite.setMinutes(fechaLimite.getMinutes() - ultimosMinutos);

        // Obtener cambios recientes agrupados por campo
        const cambiosRecientes = await HistorialPaciente.aggregate([
            {
                $match: {
                    pacienteId: pacienteId,
                    createdAt: { $gte: fechaLimite }
                }
            },
            {
                $group: {
                    _id: "$campo",
                    ultimoCambio: { $last: "$$ROOT" },
                    totalCambios: { $sum: 1 }
                }
            },
            {
                $sort: { "ultimoCambio.createdAt": -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Populatar referencias
        await HistorialPaciente.populate(cambiosRecientes, [
            { path: 'ultimoCambio.usuarioId', select: 'email name' },
            { path: 'ultimoCambio.profesionalId', select: 'nombres apellidos especialidad' }
        ]);

        return NextResponse.json({
            cambiosRecientes,
            periodoMinutos: ultimosMinutos,
            fechaConsulta: new Date()
        });

    } catch (error) {
        console.error("[historialCambios] Error obteniendo resumen:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}