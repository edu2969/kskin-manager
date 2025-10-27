import mongoose, { Schema, models } from "mongoose";

const antecedenteMorbidoSchema = new Schema(
    {
        nombre: { type: String, required: true }
    },
    { timestamps: false }
);

const AntecedenteMorbido = models.AntecedenteMorbido || mongoose.model("AntecedenteMorbido", antecedenteMorbidoSchema);
export default AntecedenteMorbido;
               