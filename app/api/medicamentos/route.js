import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Medicamento from "@/models/medicamento";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

/**
 * Retrieves all medications (Medicamentos).
 * 
 * This endpoint performs the following actions:
 * - Validates user authentication
 * - Fetches all Medicamento documents
 * @async
 * @function GET
 * @param {Request} req - The HTTP request object
 * @returns {Promise<NextResponse>} JSON response with medications list
 * @returns {Object} response.body - Response body
 * @returns {Array} response.body.medicamentos - Array of medications
 * @returns {string} response.body.error - Error message if operation fails
 * @throws {401} Unauthorized - When user is not authenticated
 * @example
 * // Success response
 * {
 *   "medicamentos": [
 *     {
 *       "_id": "64a5b8c9d1e2f3a4b5c6d7e8",
 *       "codigo": "MED001",
 *       "nombre": "Paracetamol",
 *       "createdAt": "2023-07-05T10:30:00.000Z",
 *       "updatedAt": "2023-07-05T10:30:00.000Z"
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET(req) {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findOne({ _id: session.user.id });
    if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const medicamentos = await Medicamento.find({}).lean();
        
        return NextResponse.json({
            medicamentos
        });
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener medicamentos" }, { status: 500 });
    }
}