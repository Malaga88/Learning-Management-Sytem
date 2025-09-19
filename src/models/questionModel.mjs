import mongoose from "mongoose";

const questionModel = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],  
  correctAnswer: { type: Number, required: true }, // index of correct option
}, { timestamps: true });

export default mongoose.model("Question", questionModel);
