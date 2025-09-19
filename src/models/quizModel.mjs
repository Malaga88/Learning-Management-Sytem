import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  timeLimit: { type: Number }, // minutes
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
