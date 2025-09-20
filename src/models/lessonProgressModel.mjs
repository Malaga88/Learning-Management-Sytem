import mongoose from "mongoose";

const lessonProgressModel = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "User is required"]
  },
  lesson: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Lesson", 
    required: [true, "Lesson is required"]
  },
  status: { 
    type: String, 
    enum: {
      values: ["not-started", "in-progress", "completed"],
      message: "Status must be not-started, in-progress, or completed"
    }, 
    default: "not-started" 
  },
  progress: {
    type: Number,
    min: [0, "Progress cannot be negative"],
    max: [100, "Progress cannot exceed 100"],
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    min: [0, "Time spent cannot be negative"],
    default: 0
  },
  startedAt: { 
    type: Date,
    default: Date.now
  },
  completedAt: { 
    type: Date 
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  bookmarks: [{
    timestamp: Number, // for video bookmarks in seconds
    note: String
  }],
  notes: {
    type: String,
    maxlength: [2000, "Notes cannot exceed 2000 characters"]
  }
}, { 
  timestamps: true 
});

// Indexes
lessonProgressModel.index({ user: 1, lesson: 1 }, { unique: true });
lessonProgressModel.index({ user: 1 });
lessonProgressModel.index({ lesson: 1 });
lessonProgressModel.index({ status: 1 });

// Auto-complete when progress reaches 100%
lessonProgressModel.pre('save', function(next) {
  if (this.progress >= 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  // Set startedAt when first accessed
  if (this.isNew && this.status !== 'not-started') {
    this.startedAt = new Date();
  }
  
  next();
});

export default mongoose.model("LessonProgress", lessonProgressModel);