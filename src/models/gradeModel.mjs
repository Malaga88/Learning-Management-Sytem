import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  score: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["passed", "failed"], default: "failed" },
  attempt: { type: Number, default: 1 },
}, { timestamps: true });


gradeSchema.index({ user: 1, quiz: 1 }, { unique: true });

export default mongoose.model("Grade", gradeSchema);
