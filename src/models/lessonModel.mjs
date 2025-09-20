import mongoose from "mongoose";

const resourceModel = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Resource name is required"],
    trim: true,
    maxlength: [100, "Resource name cannot exceed 100 characters"]
  },
  url: { 
    type: String, 
    required: [true, "Resource URL is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: "Please provide a valid URL"
    }
  },
  type: {
    type: String,
    enum: {
      values: ["pdf", "video", "link", "document", "other"],
      message: "Resource type must be pdf, video, link, document, or other"
    },
    default: "other"
  }
});

const lessonModel = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: [true, "Course is required"]
  },
  title: { 
    type: String, 
    required: [true, "Lesson title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  content: { 
    type: String,
    required: [true, "Lesson content is required"]
  },
  videoUrl: { 
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: "Please provide a valid video URL"
    }
  },
  videoDuration: {
    type: Number, // in seconds
    min: [0, "Duration cannot be negative"]
  },
  order: { 
    type: Number,
    required: [true, "Lesson order is required"],
    min: [1, "Order must be at least 1"]
  },
  resources: [resourceModel],
  isPublished: { 
    type: Boolean, 
    default: false 
  },
  isFree: {
    type: Boolean,
    default: false
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: [1, "Estimated duration must be at least 1 minute"]
  }
}, { 
  timestamps: true 
});

// Indexes
lessonModel.index({ course: 1, order: 1 }, { unique: true });
lessonModel.index({ course: 1, isPublished: 1 });
lessonModel.index({ isPublished: 1 });

// Ensure lessons are ordered when queried
lessonModel.pre(/^find/, function(next) {
  if (!this.getOptions().sort) {
    this.sort({ order: 1 });
  }
  next();
});

export default mongoose.model("Lesson", lessonModel);