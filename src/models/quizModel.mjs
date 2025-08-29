import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // multiple choice options
  answer: { type: String, required: true }, // correct answer
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
