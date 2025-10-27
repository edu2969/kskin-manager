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
        required: true,
    },
    anamnesis: { type: String },
    solicitudExamenes: [{ type: String }],
    indicaciones: { type: String },
    recetas: [recetaSchema],
    antecedentesMorbidos: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true 

});

const Ficha = models.Ficha || mongoose.model("Ficha", fichaSchema);
export default Ficha;