import mongoose, { Schema, models } from "mongoose";

const metodoAnticonceptivoSchema = new Schema({
    nombre: { type: String, required: true }
}, { 
    timestamps: true 
});

const MetodoAnticonceptivo = models.MetodoAnticonceptivo || mongoose.model("MetodoAnticonceptivo", metodoAnticonceptivoSchema);
export default MetodoAnticonceptivo;