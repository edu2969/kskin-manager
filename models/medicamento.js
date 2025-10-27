import mongoose, { Schema, models } from "mongoose";

const medicamentoSchema = new Schema({
    codigo: { type: String, required: false },
    nombre: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
}, { 
    timestamps: true 
});

const Medicamento = models.Medicamento || mongoose.model("Medicamento", medicamentoSchema);
export default Medicamento;