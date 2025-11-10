import mongoose, { Schema, models } from "mongoose";

const profesionalSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        fechaIngreso: { type: Date, default: Date.now },
        fechaTermino: { type: Date },
        activo: { type: Boolean, default: true },
        historico: [
            {
                activo: { type: Boolean },
                fecha: { type: Date, default: Date.now }
            }
        ],
        especialidadIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Especialidad" }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

const Profesional = models.Profesional || mongoose.model("Profesional", profesionalSchema);
export default Profesional;