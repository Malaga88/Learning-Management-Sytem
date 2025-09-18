import gradeModel from "../models/gradeModel.mjs";
import userModel from "../models/userModel.mjs";
import quizModel from "../models/quizModel.mjs";

export const submitGrade = async (req, res) => {
  try {
    const { userId, quizId, score, maxScore } = req.body;

    // Validate user
    const user = await userModel.findById(userId);
    const quiz = await quizModel.findById(quizId);
    if (!user || !quiz) return res.status(404).json({ message: "User or Quiz not found" });

    // Create grade
    const grade = new gradeModel({
      user: userId,
      quiz: quizId,
      score,
      maxScore,
    });
    await grade.save();

    res.status(201).json({ message: "Grade created", grade });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating grade" });
  }
};


export const getGrades = async (req, res) => {
    try{
        const {userId} = req.params;
        const grades = await gradeModel.find({user: userId})
        .populate("quiz")
        .populate("user", "name email");
        
        res.json(grades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching grades" });
    }
};


export const getQuizGrade = async (req, res) => {
    try{
        const {quizId} = req.params;

        const grades = await gradeModel.find({quiz: quizId})
        .populate("user", "name email")
        .populate("quiz")

        res.json(grades)
    }catch(err){
        res.status(500).json({message: "Server error", error: err.message})
    }
};


export const getUserQuizGrade = async (req, res) => {
  try {
    const { userId, quizId } = req.params;

    const grade = await gradeModel.findOne({ user: userId, quiz: quizId })
      .populate("user", "name email")
      .populate("quiz");

    if (!grade) {
      return res.status(404).json({ message: "No grade found for this quiz" });
    }

    res.json(grade);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
