import mongoose, { Schema, models } from "mongoose";

const especialidadSchema = new Schema(
    {
        nombre: { 
            type: String, 
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        activo: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Especialidad = models.Especialidad || mongoose.model("Especialidad", especialidadSchema);
export default Especialidad;