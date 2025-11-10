import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Ficha from "@/models/ficha";
import Paciente from "@/models/paciente";
import Profesional from "@/models/profesional";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

/**
 * Retrives a medical record (Ficha) by its ID, including associated patient and professional details.
 * 
 * This endpoint performs the following actions:
 * - Validates user authentication
 * - Fetches the Ficha document by ID
 * - Populates related patient and professional information
 * @async
 * @function GET
 * @param {Request} req - The HTTP request object containing the Ficha ID as a query parameter
 * @param {string} req.url - The full URL of the request, from which the Ficha ID is extracted
 * @returns {Promise<NextResponse>} JSON response with Ficha details
 * @returns {Object} response.body - Response body
 * @returns {Object} response.body.ficha - The Ficha document
 * @returns {Object} response.body.paciente - The associated patient details
 * @returns {Object} response.body.profesional - The associated professional details with specialties
 * @returns {string} response.body.error - Error message if operation fails
 * @throws {401} Unauthorized - When user is not authenticated
 * @throws {400} Bad Request - When required fields are missing
 * @throws {404} Not Found - When Ficha is not found
 * @example
 * // Request URL
 * GET /api/profesional/fichaPorId?id=64a5b8c9d1e2f3a4b5c6d7e8
 *  // Success response
 * {    
 *  "ficha": { ... },
 *  "paciente": { ... },
 *  "profesional": { 
 *    "userId": { "email": "...", "name": "..." },
 *    "especialidadIds": [{ "nombre": "Cardiología", "activo": true }],
 *    ...
 *  }
 * }
 *  */
export async function GET(req) {
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = await User.findOne({ _id: session.user.id });
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const ficha = await Ficha.findById(id).lean();
    
    if (!ficha) {
        return NextResponse.json({ error: "Ficha no encontrada" }, { status: 404 });
    }

    // Poblar datos del profesional con especialidades
    const profesional = await Profesional.findById(ficha.profesionalId)
        .populate({ path: "userId", select: "email name" })
        .populate({ 
            path: "especialidadIds", 
            select: "nombre activo",
            match: { activo: true } // Solo especialidades activas
        })
        .lean();

    // Poblar datos del paciente
    const paciente = await Paciente.findById(ficha.pacienteId).lean();
    
    return NextResponse.json({
        ficha,
        paciente,
        profesional
    });
}