import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  content: { 
    type: String, // could be markdown, HTML, or plain text
    required: true 
  },
  videoUrl: { 
    type: String, 
    trim: true 
  },
  order: { 
    type: Number, 
    default: 0 
  }, // to control lesson sequence inside a course
  resources: [
    {
      name: { type: String, required: true },
      url: { type: String, required: true }
    }
  ],
  isPublished: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export default mongoose.model("Lesson", lessonSchema);
