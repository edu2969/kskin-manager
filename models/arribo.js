import mongoose, { Schema, models } from "mongoose";

const arriboSchema = new Schema({
        pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente", required: true },
        profesionalId: { type: mongoose.Schema.Types.ObjectId, ref: "Profesional" },
        fechaLlegada: { type: Date, required: true },
        fechaAtencion: { type: Date, default: null },
        fechaRetiro: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Arribo = models.Arribo || mongoose.model("Arribo", arriboSchema);
export default Arribo;