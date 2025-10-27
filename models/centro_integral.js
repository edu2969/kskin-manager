import mongoose, { Schema, models } from "mongoose";

const centroIntegralSchema = new Schema(
    {
        nombre: { type: String, required: true },
        direccion: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const CentroIntegral = models.CentroIntegral || mongoose.model("CentroIntegral", centroIntegralSchema);
export default CentroIntegral;