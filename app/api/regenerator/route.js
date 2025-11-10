import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Arribo from "@/models/arribo";
import Box from "@/models/box";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

/**
 * Regenerates clinic data for testing purposes.
 * 
 * @async
 * @function GET
 * @param {Request} req - The HTTP request object containing query parameter "q"
 * @returns {Promise<NextResponse>} JSON response with operation result
 */
export async function GET(req) {
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
        return NextResponse.json({ error: "Parámetro 'q' requerido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (q === "resetClinica") {
        try {
            await resetClinica();
            return NextResponse.json({ message: "Clínica reseteada exitosamente" });
        } catch {
            return NextResponse.json({ error: "Error al resetear clínica" }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "Parámetro 'q' no válido" }, { status: 400 });
}

/**
 * Resets clinic data by updating arrivals and boxes
 */
async function resetClinica() {
    // Reset all arrivals to show patients arrived within the last hour without attention
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    await Arribo.updateMany(
        {},
        {
            $set: {
                fechaLlegada: new Date(oneHourAgo.getTime() + Math.random() * 60 * 60 * 1000),
                fechaAtencion: null,
                fechaRetiro: null,
                profesionalId: null,
                updatedAt: new Date()
            }
        }
    );

    // Reset all boxes to be unoccupied
    await Box.updateMany(
        {},
        {
            $set: {
                "ocupacion.ocupado": false,
                "ocupacion.fechaCambio": new Date(),
                "ocupacion.tiempoEstimado": null,
                pacienteId: null,
                profesionalId: null,
                inicioAtencion: null,
                terminoAtencion: null,
                updatedAt: new Date()
            }
        }
    );
}