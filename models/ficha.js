import mongoose, { Schema, models } from "mongoose";

const recetaSchema = new Schema({
    fecha: { type: Date, required: true },
    texto: { type: String, required: true },
}, { 
    _id: false 
});

const fichaSchema = new Schema({
    pacienteId: {
        type: Schema.Types.ObjectId,
        ref: "Paciente",
        required: true,
    },
    profesionalId: {
        type: Schema.Types.ObjectId,
        ref: "Profesional",
        required: false, // OPCIONAL: permite fichas sin profesional asignado inicialmente
    },
    motivoConsulta: { type: String, default: "Consulta general" },
    anamnesis: { type: String },
    solicitudExamenes: [{ type: String }],
    indicaciones: { type: String },
    recetas: [recetaSchema],
    
    // Campos específicos de la consulta médica
    examenFisico: { type: String },
    diagnostico: { type: String },
    planTratamiento: { type: String },
    observaciones: { type: String },
    
    // Campos de evaluación de la sesión
    presionArterial: { type: String },
    frecuenciaCardiaca: { type: Number },
    temperatura: { type: Number },
    peso: { type: Number },
    talla: { type: Number },
    imc: { type: Number },
    
    // Estado de la consulta
    estadoConsulta: { 
        type: String, 
        enum: ["PENDIENTE", "EN_CURSO", "FINALIZADA", "CANCELADA"],
        default: "PENDIENTE" // PENDIENTE: sin profesional asignado
    },
    
    // Campos de tiempo
    horaInicio: { type: Date },
    horaFin: { type: Date },
    duracionMinutos: { type: Number },
    
}, { timestamps: true });

const Ficha = models.Ficha || mongoose.model("Ficha", fichaSchema);
export default Ficha;