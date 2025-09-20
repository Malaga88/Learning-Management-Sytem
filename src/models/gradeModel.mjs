import mongoose from "mongoose";

const attemptModel = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: [0, "Score cannot be negative"]
  },
  maxScore: {
    type: Number,
    required: true,
    min: [1, "Max score must be at least 1"]
  },
  percentage: {
    type: Number,
    min: [0, "Percentage cannot be negative"],
    max: [100, "Percentage cannot exceed 100"]
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    selectedAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    points: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 } // seconds
  }],
  timeSpent: { type: Number, default: 0 }, // total seconds
  submittedAt: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
});

// Auto-calc percentage
attemptModel.pre("save", function (next) {
  if (this.score !== undefined && this.maxScore) {
    this.percentage = Math.round((this.score / this.maxScore) * 100);
  }
  next();
});

const gradeModel = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    quiz: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Quiz", 
      required: true 
    },
    attempts: [attemptModel],

    // Summary fields (controller updates these after each attempt)
    bestScore: { type: Number, default: 0 },
    bestPercentage: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ["passed", "failed", "in-progress"], 
      default: "in-progress" 
    },
    firstAttemptAt: Date,
    lastAttemptAt: Date
  },
  { timestamps: true }
);

// Indexes
gradeModel.index({ user: 1, quiz: 1 }, { unique: true });
gradeModel.index({ user: 1 });
gradeModel.index({ quiz: 1 });
gradeModel.index({ status: 1 });

export default mongoose.model("Grade", gradeModel);
