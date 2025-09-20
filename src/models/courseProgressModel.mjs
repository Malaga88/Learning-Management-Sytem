import mongoose from "mongoose";

const courseProgressModel = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["completed", "in-progress"], default: "in-progress" },
  completedAt: { type: Date }
}, { timestamps: true });

// Ensure one record per user per course
courseProgressModel.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model("CourseProgress", courseProgressModel);
