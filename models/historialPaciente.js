import mongoose, { Schema, models } from "mongoose";

const partoSchema = new Schema({
    fecha: { type: Date },
    tipoParto: { 
        type: String, 
        enum: ["VAGINAL", "CESAREA", "ABORTO"],
        required: true
    },
    meses: { type: Number },
    genero: { type: String },
}, {
    _id: false
});

const higieneSchema = new Schema({
    fuma: { type: Boolean, default: false },
    agua: { type: Number },
    ejercicioSemanal: { type: Number },
    nivelStress: { type: Number },
    calidadDormir: { type: Number },
    habitoAlimenticio: { type: String }
}, {
    _id: false
});

const historialPacienteSchema = new Schema({
    // NUEVO: ID de la ficha asociada (REQUERIDO)
    fichaId: { 
        type: Schema.Types.ObjectId, 
        ref: "Ficha", 
        required: true,
        index: true 
    },
    
    // Información del paciente (snapshot al momento de la atención)
    nombres: { type: String, required: true },
    apellidos: { type: String },
    rut: { type: String, required: true, index: true },
    email: { type: String },
    fechaNacimiento: { type: Date },
    genero: { type: String },
    nombreSocial: { type: String },
    grupoSanguineo: { type: String },
    correoElectronico: { type: String },
    rutResponsable: { type: String },
    direccion: { type: String },
    telefono: { type: String },
    sistemaSalud: {
        type: String,
        enum: ["FON", "ISA", "PAR", "FAR", "OTR"]
    },
    alergias: [{ type: String }],
    
    // Información médica (snapshot al momento de la atención)
    antecedenteMorbidoIds: [{
        type: Object,
        ref: "AntecedenteMoribido"
    }],
    medicamentoIds: [{
        type: Object,
        ref: "Medicamento"
    }],
    operaciones: { type: String },
    metodoAnticonceptivos: [{
        type: Object,
        ref: "MetodoAnticonceptivo"
    }],
    partos: [partoSchema],
    higiene: higieneSchema,
    
    // Información de la atención médica (snapshot de la ficha)
    anamnesis: { type: String },
    solicitudExamenes: [{ type: String }],
    indicaciones: { type: String },
    recetas: [{ type: String }],
    
    // Metadatos del historial
    profesionalId: { 
        type: Schema.Types.ObjectId, 
        ref: "Profesional", 
        required: false // OPCIONAL: puede no tener doctor asignado al inicio
    },
    usuarioId: {
        type: Schema.Types.ObjectId, 
        ref: "User",
        required: true
    },
    fechaAtencion: { 
        type: Date, 
        default: Date.now,
        required: true
    },
    especialidad: { type: String },
    
    // Contexto del snapshot
    tipoOperacion: {
        type: String,
        enum: ["CONSULTA_FINALIZADA", "SNAPSHOT_CONSULTA", "REGISTRO_INICIAL", "ACTUALIZACION_DATOS"],
        default: "CONSULTA_FINALIZADA",
        required: true
    },
    
    // Observaciones opcionales
    notas: { type: String },
    observaciones: { type: String }
    
}, { 
    timestamps: true
});

// Índices compuestos para consultas eficientes
historialPacienteSchema.index({ rut: 1, fechaAtencion: -1 });
historialPacienteSchema.index({ fichaId: 1 });
historialPacienteSchema.index({ profesionalId: 1, fechaAtencion: -1 });
historialPacienteSchema.index({ usuarioId: 1, fechaAtencion: -1 });

const HistorialPaciente = models.HistorialPaciente || mongoose.model("HistorialPaciente", historialPacienteSchema);
export default HistorialPaciente;