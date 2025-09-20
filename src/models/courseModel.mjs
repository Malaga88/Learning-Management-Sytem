import mongoose from "mongoose";

const courseModel = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Course title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  description: { 
    type: String,
    required: [true, "Course description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  thumbnailUrl: { 
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: "Please provide a valid URL"
    }
  },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "Instructor is required"]
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, "Category cannot exceed 50 characters"]
  },
  level: {
    type: String,
    enum: {
      values: ["beginner", "intermediate", "advanced"],
      message: "Level must be beginner, intermediate, or advanced"
    },
    default: "beginner"
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, "Tag cannot exceed 30 characters"]
  }],
  price: {
    type: Number,
    min: [0, "Price cannot be negative"],
    default: 0
  },
  duration: {
    type: Number, // in hours
    min: [0, "Duration cannot be negative"]
  },
  maxStudents: {
    type: Number,
    min: [1, "Maximum students must be at least 1"],
    default: 1000
  },
  currentEnrollments: {
    type: Number,
    default: 0,
    min: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  requirements: [{
    type: String,
    trim: true,
    maxlength: [200, "Requirement cannot exceed 200 characters"]
  }],
  learningOutcomes: [{
    type: String,
    trim: true,
    maxlength: [200, "Learning outcome cannot exceed 200 characters"]
  }],
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, min: 0, default: 0 }
  }
}, { 
  timestamps: true 
});

// Indexes
courseModel.index({ instructor: 1 });
courseModel.index({ title: 1, instructor: 1 }, { unique: true });
courseModel.index({ category: 1 });
courseModel.index({ level: 1 });
courseModel.index({ isPublished: 1 });
courseModel.index({ tags: 1 });
courseModel.index({ "rating.average": -1 });
courseModel.index({ createdAt: -1 });

courseModel.virtual('lessonCount', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
  count: true
});

// Virtual for quiz count
courseModel.virtual('quizCount', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'course',
  count: true
});

// Ensure virtuals are included in JSON
courseModel.set('toJSON', { virtuals: true });

export default mongoose.model("Course", courseModel);
