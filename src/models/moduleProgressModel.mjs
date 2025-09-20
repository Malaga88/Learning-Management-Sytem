import mongoose from "mongoose";

const moduleProgressModel = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  status: { type: String, enum: ["completed", "in-progress"], default: "in-progress" },
  completedAt: { type: Date }
}, { timestamps: true });

// Ensure one record per user per module
moduleProgressModel.index({ user: 1, module: 1 }, { unique: true });

export default mongoose.model("ModuleProgress", moduleProgressModel);
