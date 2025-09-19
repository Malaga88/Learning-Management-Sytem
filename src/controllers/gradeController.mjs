import gradeModel from "../models/gradeModel.mjs";
import userModel from "../models/userModel.mjs";
import quizModel from "../models/quizModel.mjs";
import enrollmentModel from "../models/enrollmentModel.mjs";


export const submitGrade = async (req, res) => {
  try {
    const { userId, quizId, score, maxScore, attempt = 1 } = req.body;


    const user = await userModel.findById(userId);
    const quiz = await quizModel.findById(quizId).populate("course");
    if (!user || !quiz) {
      return res.status(404).json({ message: "User or quiz not found" });
    }


    const percentage = (score / maxScore) * 100;
    const status = percentage >= 50 ? "passed" : "failed";


    const grade = await gradeModel.findOneAndUpdate(
      { user: userId, quiz: quizId },
      { score, maxScore, status, attempt },
      { new: true, upsert: true, runValidators: true }
    );


    const courseId = quiz.course._id;


    let enrollment = await enrollmentModel.findOne({ user: userId, course: courseId });
    if (!enrollment) {
      enrollment = await enrollmentModel.create({ user: userId, course: courseId });
    }

    // Count quizzes in this course
    const totalQuizzes = await quizModel.countDocuments({ course: courseId });

    // Count how many quizzes user has grades for (passed or failed)
    const completedQuizzes = await gradeModel.countDocuments({ user: userId, quiz: { $in: await quizModel.find({ course: courseId }).distinct("_id") } });

    // Calculate progress
    const progress = Math.round((completedQuizzes / totalQuizzes) * 100);

    enrollment.progress = progress;
    if (progress === 100) {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.status(201).json({
      message: "Grade submitted and progress updated",
      grade,
      enrollment,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Grade already exists for this quiz" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
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



