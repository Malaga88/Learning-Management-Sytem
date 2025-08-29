import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }], 
  answer: { type: String, required: true }, 
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
