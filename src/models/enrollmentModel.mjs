import mongoose from "mongoose";

const enrollmentModel = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "User is required"]
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: [true, "Course is required"]
  },
  progress: { 
    type: Number, 
    default: 0, 
    min: [0, "Progress cannot be negative"], 
    max: [100, "Progress cannot exceed 100"] 
  },
  status: { 
    type: String, 
    enum: {
      values: ["active", "completed", "dropped", "suspended"],
      message: "Status must be active, completed, dropped, or suspended"
    }, 
    default: "active" 
  },
  enrolledAt: {
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
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ["pending", "completed", "failed", "refunded", "free"],
      message: "Payment status must be pending, completed, failed, refunded, or free"
    },
    default: "free"
  },
  paymentAmount: {
    type: Number,
    min: [0, "Payment amount cannot be negative"],
    default: 0
  }
}, { 
  timestamps: true 
});

// Indexes
enrollmentModel.index({ user: 1, course: 1 }, { unique: true });
enrollmentModel.index({ user: 1 });
enrollmentModel.index({ course: 1 });
enrollmentModel.index({ status: 1 });
enrollmentModel.index({ enrolledAt: -1 });

// Update lastAccessedAt on save
enrollmentModel.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastAccessedAt = new Date();
  }
  next();
});

// Mark as completed when progress reaches 100%
enrollmentModel.pre('save', function(next) {
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  next();
});

export default mongoose.model("Enrollment", enrollmentModel);