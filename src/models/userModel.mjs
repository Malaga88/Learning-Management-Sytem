import mongoose from "mongoose";

const userModel = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: { 
    type: String, 
    unique: true, 
    required: [true, "Email is required"], 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  password: { 
    type: String, 
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  role: { 
    type: String, 
    enum: {
      values: ["admin", "instructor", "student"],
      message: "Role must be either admin, instructor, or student"
    }, 
    default: "student" 
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
    trim: true
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});


userModel.index({ email: 1 }, { unique: true });
userModel.index({ role: 1 });
userModel.index({ isActive: 1 });


export default mongoose.model("User", userModel);
