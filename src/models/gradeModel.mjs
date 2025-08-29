import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  score: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("Grade", gradeSchema);
