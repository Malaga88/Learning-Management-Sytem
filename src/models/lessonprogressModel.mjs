import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  status: { type: String, enum: ["completed", "in-progress"], default: "in-progress" },
  completedAt: { type: Date }
}, { timestamps: true });

// Ensure one progress record per user per lesson
lessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

export default mongoose.model("LessonProgress", lessonProgressSchema);
