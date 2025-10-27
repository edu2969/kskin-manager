import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Box from "@/models/box";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import Ficha from "@/models/ficha";
import Arribo from "@/models/arribo";
import Profesional from "@/models/profesional";

/**
 * Assigns a patient to a specific box and professional for medical attention.
 * 
 * This endpoint handles the assignment process by:
 * - Validating professional authentication and authorization
 * - Updating box occupation status with estimated time
 * - Creating a new medical record (Ficha)
 * - Updating patient arrival record with attention details
 * 
 * @async
 * @function POST
 * @param {Request} req - The HTTP request object containing assignment data
 * @param {string} req.body.boxId - The unique identifier of the box to assign
 * @param {string} req.body.pacienteId - The unique identifier of the patient
 * @param {number} req.body.tiempoEstimado - Estimated time for the medical attention (in minutes)
 * 
 * @returns {Promise<NextResponse>} JSON response with assignment result
 * @returns {Object} response.body - Response body
 * @returns {boolean} response.body.ok - Success status indicator
 * @returns {Object} response.body.box - Updated box object with new assignment details
 * @returns {string} response.body.error - Error message if operation fails
 * 
 * @throws {401} Unauthorized - When user is not authenticated
 * @throws {403} Forbidden - When user is not a professional
 * @throws {400} Bad Request - When required fields are missing
 * @throws {404} Not Found - When box or professional is not found
 * 
 * @example
 * // Request body
 * {
 *   "boxId": "64a5b8c9d1e2f3a4b5c6d7e8",
 *   "pacienteId": "64a5b8c9d1e2f3a4b5c6d7e9",
 *   "tiempoEstimado": 30
 * }
 * 
 * // Success response
 * {
 *   "ok": true,
 *   "box": {
 *     "_id": "64a5b8c9d1e2f3a4b5c6d7e8",
 *     "ocupacion": {
 *       "ocupado": true,
 *       "tiempoEstimado": 30,
 *       "fechaCambio": "2023-07-15T10:30:00.000Z"
 *     },
 *     "profesionalId": "64a5b8c9d1e2f3a4b5c6d7ea",
 *     "pacienteId": "64a5b8c9d1e2f3a4b5c6d7e9",
 *     "inicioAtencion": "2023-07-15T10:30:00.000Z"
 *   }
 * }
 * 
 * @since 1.0.0
 * @author [Author Name]
 * @see {@link Box} Box model for box structure
 * @see {@link Profesional} Profesional model for professional data
 * @see {@link Ficha} Ficha model for medical records
 * @see {@link Arribo} Arribo model for patient arrivals
 */
export async function POST(req) {
    await connectMongoDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await User.findOne({ _id: userId });
    if (!user || user.role !== USER_ROLE.profesional) {
        return NextResponse.json({ error: "Solo profesionales pueden asignar box" }, { status: 403 });
    }

    const { boxId, pacienteId, tiempoEstimado } = await req.json();
    if (!boxId || !tiempoEstimado || !pacienteId) {
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const box = await Box.findById(boxId);
    if (!box) {
        return NextResponse.json({ error: "Box no encontrado" }, { status: 404 });
    }

    const profesional = await Profesional.findOne({ userId: userId });
    if (!profesional) {
        return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }
    
    // Actualiza la ocupación y profesionalId
    box.inicioAtencion = new Date();
    box.profesionalId = profesional._id;
    box.ocupacion = {
        fechaCambio: new Date(),
        ocupado: true,
        tiempoEstimado: tiempoEstimado
    };
    box.pacienteId = pacienteId;
    box.updatedAt = new Date();

    await box.save();

    await Ficha.create({
        pacienteId: pacienteId,
        profesionalId: profesional._id,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const arriboActual = await Arribo.findOne({
        pacienteId: pacienteId,
        fechaAtencion: { $exists: false }
    }).sort({ fechaLlegada: -1 });

    if (arriboActual) {
        arriboActual.profesionalId = profesional._id;
        arriboActual.fechaAtencion = new Date();
        arriboActual.updatedAt = new Date();
        await arriboActual.save();
    }

    return NextResponse.json({ ok: true, box });
}