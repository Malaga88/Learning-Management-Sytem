import mongoose from "mongoose";

const quizModel = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: [true, "Course is required"]
  },
  title: { 
    type: String, 
    required: [true, "Quiz title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  timeLimit: { 
    type: Number, // in minutes
    min: [1, "Time limit must be at least 1 minute"],
    max: [480, "Time limit cannot exceed 8 hours"]
  },
  questions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Question" 
  }],
  passingScore: {
    type: Number,
    min: [0, "Passing score cannot be negative"],
    max: [100, "Passing score cannot exceed 100"],
    default: 60
  },
  maxAttempts: {
    type: Number,
    min: [1, "Must allow at least 1 attempt"],
    default: 3
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    min: [1, "Order must be at least 1"]
  }
}, { 
  timestamps: true 
});

// Indexes
quizModel.index({ course: 1 });
quizModel.index({ course: 1, order: 1 });
quizModel.index({ isPublished: 1 });

// Virtual for question count
quizModel.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'quiz',
  count: true
});

quizModel.set('toJSON', { virtuals: true });

export default mongoose.model("Quiz", quizModel);
