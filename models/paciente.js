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

const pacienteSchema = new Schema({
    nombres: { type: String, required: true },
    apellidos: { type: String },
    rut: { type: String, required: true, unique: true },
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
    antecedenteMorbidoIds: [{
        type: Object,
        ref: "AntecedenteMorbido"
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
}, { 
    timestamps: true 
});

const Paciente = models.Paciente || mongoose.model("Paciente", pacienteSchema);
export default Paciente;