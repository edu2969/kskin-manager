import mongoose, { Schema, models } from "mongoose";

const specialtySchema = new Schema(
    {
        nombre: { type: String, required: true },
        activo: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Specialty = models.Specialty || mongoose.model("Specialty", specialtySchema);
export default Specialty;