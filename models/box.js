import mongoose, { Schema, models } from "mongoose";

const boxSchema = new Schema(
    {
        numero: { type: Number, required: true, unique: true },
        referencia: { type: String },
        ocupacion: {
            fechaCambio: { type: Date, default: Date.now },
            ocupado: { type: Boolean, default: false },
            tiempoEstimado: { type: Number }, // minutos
        },
        pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente" },
        profesionalId: { type: mongoose.Schema.Types.ObjectId, ref: "Profesional" },
        inicioAtencion: { type: Date },
        terminoAtencion: { type: Date },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Box = models.Box || mongoose.model("Box", boxSchema);
export default Box;