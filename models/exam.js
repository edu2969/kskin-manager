import mongoose, { Schema, models } from "mongoose";

const subExamSchema = new Schema({
    codigo: { type: String, required: true },
    nombre: { type: String, required: true }
}, { _id: false });

const examSchema = new Schema({
    codigo: { type: String, required: false },
    nombre: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    sub: [subExamSchema]
}, { 
    timestamps: true 
});

const Exam = models.Exam || mongoose.model("Exam", examSchema);
export default Exam;