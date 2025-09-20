import mongoose from "mongoose";

const questionModel = new mongoose.Schema({
  quiz: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Quiz", 
    required: [true, "Quiz is required"]
  },
  text: { 
    type: String, 
    required: [true, "Question text is required"],
    trim: true,
    minlength: [5, "Question must be at least 5 characters"],
    maxlength: [1000, "Question cannot exceed 1000 characters"]
  },
  type: {
    type: String,
    enum: {
      values: ["multiple-choice", "true-false", "fill-in-blank"],
      message: "Question type must be multiple-choice, true-false, or fill-in-blank"
    },
    default: "multiple-choice"
  },
  options: [{
    text: {
      type: String,
      required: [true, "Option text is required"],
      trim: true,
      maxlength: [200, "Option cannot exceed 200 characters"]
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: { 
    type: Number,
    required: function() {
      return this.type === "multiple-choice";
    },
    min: [0, "Correct answer index must be 0 or greater"]
  },
  points: {
    type: Number,
    min: [1, "Points must be at least 1"],
    default: 1
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [500, "Explanation cannot exceed 500 characters"]
  },
  difficulty: {
    type: String,
    enum: {
      values: ["easy", "medium", "hard"],
      message: "Difficulty must be easy, medium, or hard"
    },
    default: "medium"
  },
  order: {
    type: Number,
    min: [1, "Order must be at least 1"]
  }
}, { 
  timestamps: true 
});

// Indexes
questionModel.index({ quiz: 1 });
questionModel.index({ quiz: 1, order: 1 });

// Validation for multiple choice questions
questionModel.pre('validate', function(next) {
  if (this.type === 'multiple-choice') {
    if (!this.options || this.options.length < 2) {
      return next(new Error('Multiple choice questions must have at least 2 options'));
    }
    if (this.correctAnswer >= this.options.length) {
      return next(new Error('Correct answer index is out of range'));
    }
    // Ensure at least one option is marked as correct
    const hasCorrectOption = this.options.some(option => option.isCorrect);
    if (!hasCorrectOption && this.correctAnswer !== undefined) {
      this.options[this.correctAnswer].isCorrect = true;
    }
  }
  next();
});

export default mongoose.model("Question", questionModel);
