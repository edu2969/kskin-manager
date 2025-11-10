import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Paciente from "@/models/paciente";
import Ficha from "@/models/ficha";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { USER_ROLE } from "@/app/utils/constants";
import Profesional from "@/models/profesional";

export async function PATCH(req) {
  await connectMongoDB();
  console.log("[batchUpdate] Conexión a MongoDB establecida");

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.warn("[batchUpdate] No autorizado");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await User.findOne({ _id: session.user.id });
  if (!user || (user.role !== USER_ROLE.profesional && user.role !== USER_ROLE.recepcionista)) {
    console.warn("[batchUpdate] Acceso denegado");
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { pacienteId, operations } = body;

    if (!pacienteId || !operations || !Array.isArray(operations)) {
      return NextResponse.json({ 
        error: "pacienteId y operations son requeridos" 
      }, { status: 400 });
    }

    console.log(`[batchUpdate] Procesando ${operations.length} operaciones para paciente ${pacienteId}`);

    // Get current professional
    const profesional = await Profesional.findOne({ userId: user._id });
    if (!profesional) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    // Get current ficha for ficha-related operations
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    let ficha = await Ficha.findOne({
      pacienteId,
      profesionalId: profesional._id,
      createdAt: { $gte: hoy, $lt: manana }
    });

    const results = [];
    const errors = [];

    // Process each operation
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      
      try {
        const result = await processBatchOperation(op, pacienteId, ficha, profesional);
        results.push({
          operation: i,
          field: op.field,
          success: true,
          result
        });
        
        // Update ficha reference if it was created
        if (result && result.ficha) {
          ficha = result.ficha;
        }
        
      } catch (error) {
        console.error(`[batchUpdate] Error en operación ${i}:`, error);
        errors.push({
          operation: i,
          field: op.field,
          error: error.message
        });
      }
    }

    console.log(`[batchUpdate] Completado: ${results.length} éxitos, ${errors.length} errores`);

    return NextResponse.json({
      success: errors.length === 0,
      processed: operations.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("[batchUpdate] Error general:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error.message 
    }, { status: 500 });
  }
}

async function processBatchOperation(
  operation, 
  pacienteId, 
  ficha, 
  profesional
) {
  const { operation: op, field, value, arrayFilters } = operation;

  // Determine target model based on field
  const isFieldInFicha = ['anamnesis', 'solicitudExamenes', 'indicaciones', 'recetas'].includes(field);
  
  if (isFieldInFicha) {
    // Handle ficha operations
    if (!ficha) {
      // Create ficha if it doesn't exist
      ficha = await Ficha.create({
        pacienteId,
        profesionalId: profesional._id,
        [field]: getDefaultValue(field, op, value)
      });
      return { ficha };
    } else {
      // Update existing ficha
      const updateQuery = buildUpdateQuery(op, field, value, arrayFilters);
      const updatedFicha = await Ficha.findByIdAndUpdate(
        ficha._id,
        updateQuery,
        { new: true, arrayFilters }
      );
      return { ficha: updatedFicha };
    }
  } else {
    // Handle paciente operations
    const updateQuery = buildUpdateQuery(op, field, value, arrayFilters);
    const updatedPaciente = await Paciente.findByIdAndUpdate(
      pacienteId,
      updateQuery,
      { new: true, arrayFilters }
    );
    return { paciente: updatedPaciente };
  }
}

function buildUpdateQuery(operation, field, value) {
  switch (operation) {
    case 'set':
      return { $set: { [field]: value } };
    
    case 'push':
      return { $push: { [field]: value } };
    
    case 'pull':
      return { $pull: { [field]: value } };
    
    case 'unset':
      return { $unset: { [field]: "" } };
    
    case 'inc':
      return { $inc: { [field]: value } };
    
    default:
      throw new Error(`Operación no soportada: ${operation}`);
  }
}

function getDefaultValue(field, operation, value) {
  if (operation === 'set') return value;
  
  // Default values for different field types
  switch (field) {
    case 'solicitudExamenes':
    case 'recetas':
      return operation === 'push' ? [value] : [];
    
    case 'anamnesis':
    case 'indicaciones':
      return operation === 'set' ? value : '';
    
    default:
      return value;
  }
}

// GET method for batch operation status/info
export async function GET() {
  return NextResponse.json({
    endpoint: 'batchUpdate',
    methods: ['PATCH'],
    description: 'Batch update operations for patient and ficha data',
    supportedOperations: ['set', 'push', 'pull', 'unset', 'inc'],
    usage: {
      method: 'PATCH',
      body: {
        pacienteId: 'string',
        operations: [
          {
            operation: 'set | push | pull | unset | inc',
            field: 'string',
            value: 'any',
            arrayFilters: 'optional array'
          }
        ]
      }
    }
  });
}