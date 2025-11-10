import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import AntecedenteMorbido from "@/models/antecedenteMorbido";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

/**
 * Retrieves all medical history records (Antecedentes Mórbidos).
 * 
 * This endpoint performs the following actions:
 * - Validates user authentication
 * - Fetches all AntecedenteMoribido documents
 * @async
 * @function GET
 * @param {Request} req - The HTTP request object
 * @returns {Promise<NextResponse>} JSON response with antecedentes mórbidos list
 * @returns {Object} response.body - Response body
 * @returns {Array} response.body.antecedentesMorbidos - Array of antecedentes mórbidos
 * @returns {string} response.body.error - Error message if operation fails
 * @throws {401} Unauthorized - When user is not authenticated
 * @example
 * // Success response
 * {
 *   "antecedentesMorbidos": [
 *     {
 *       "_id": "64a5b8c9d1e2f3a4b5c6d7e8",
 *       "nombre": "Diabetes",
 *       "createdAt": "2023-07-05T10:30:00.000Z",
 *       "updatedAt": "2023-07-05T10:30:00.000Z"
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET() {
    await connectMongoDB();

    try {
        const antecedentesMorbidos = await AntecedenteMorbido.find({}).lean();
        
        return NextResponse.json({
            antecedentes: antecedentesMorbidos
        });
    } catch {
        return NextResponse.json({ error: "Error al obtener antecedentes mórbidos" }, { status: 500 });
    }
}

/**
 * Creates a new medical history record (Antecedente Mórbido).
 * 
 * This endpoint performs the following actions:
 * - Validates user authentication
 * - Creates a new AntecedenteMoribido document with the provided name
 * @async
 * @function POST
 * @param {Request} req - The HTTP request object
 * @returns {Promise<NextResponse>} JSON response with created antecedente mórbido
 * @returns {Object} response.body - Response body
 * @returns {Object} response.body.antecedenteMorbido - Created antecedente mórbido object
 * @returns {string} response.body.error - Error message if operation fails
 * @throws {400} Bad Request - When nombre is missing or invalid
 * @throws {401} Unauthorized - When user is not authenticated
 * @throws {409} Conflict - When antecedente mórbido already exists
 * @example
 * // Request body
 * {
 *   "nombre": "Hipertensión"
 * }
 * 
 * // Success response
 * {
 *   "antecedenteMorbido": {
 *     "_id": "64a5b8c9d1e2f3a4b5c6d7e8",
 *     "nombre": "Hipertensión",
 *     "createdAt": "2023-07-05T10:30:00.000Z",
 *     "updatedAt": "2023-07-05T10:30:00.000Z"
 *   }
 * }
 */
export async function POST(req) {
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
        const { nombre } = await req.json();

        if (!nombre || nombre.trim() === "") {
            return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
        }

        // Check if antecedente mórbido already exists
        const existingAntecedente = await AntecedenteMorbido.findOne({ 
            nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') } 
        });

        if (existingAntecedente) {
            return NextResponse.json({ error: "El antecedente mórbido ya existe" }, { status: 409 });
        }

        const antecedenteMorbido = await AntecedenteMorbido.create({
            nombre: nombre.trim()
        });

        return NextResponse.json({
            antecedenteMorbido
        }, { status: 201 });

    } catch {
        return NextResponse.json({ error: "Error al crear antecedente mórbido" }, { status: 500 });
    }
}