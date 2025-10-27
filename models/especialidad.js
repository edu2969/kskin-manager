import mongoose, { Schema, models } from "mongoose";

const especialidadSchema = new Schema(
    {
        nombre: { type: String, required: true },
        activo: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Especialidad = models.Especialidad || mongoose.model("Especialidad", especialidadSchema);
export default Especialidad;