import quizModel from "../models/quizModel.mjs";
import questionModel from "../models/questionModel.mjs";
import gradeModel from "../models/gradeModel.mjs";
import moduleProgressModel from "../models/moduleProgressModel.mjs";
import courseProgressModel from "../models/courseProgressModel.mjs";
import moduleModel from "../models/moduleModel.mjs";

// Create a new quiz with optional questions
export const createQuiz = async (req, res) => {
  try {
    const { moduleId, title, description, timeLimit, questions } = req.body;

    const newQuiz = new quizModel({ module: moduleId, title, description, timeLimit });
    await newQuiz.save();

    if (questions && questions.length > 0) {
      const createdQuestions = await questionModel.insertMany(
        questions.map(q => ({ ...q, quiz: newQuiz._id }))
      );
      newQuiz.questions = createdQuestions.map(q => q._id);
      await newQuiz.save();
    }

    res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating quiz" });
  }
};

// Get all quizzes (with question count only)
export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await quizModel.find()
      .populate("module", "title")
      .lean();

    const quizzesWithCount = quizzes.map(quiz => ({
      ...quiz,
      questionCount: quiz.questions?.length || 0
    }));

    res.status(200).json({
      message: "Quizzes retrieved successfully",
      quizzes: quizzesWithCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving quizzes" });
  }
};

// Get quiz by ID (with questions)
export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await quizModel.findById(id).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    res.status(200).json({ message: "Quiz retrieved successfully", quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving quiz" });
  }
};

// Update quiz
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, timeLimit } = req.body;

    const updatedQuiz = await quizModel.findByIdAndUpdate(
      id,
      { title, description, timeLimit },
      { new: true }
    );

    if (!updatedQuiz) return res.status(404).json({ message: "Quiz not found" });

    res.status(200).json({ message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating quiz" });
  }
};

// Delete quiz and related questions
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedQuiz = await quizModel.findByIdAndDelete(id);
    if (!deletedQuiz) return res.status(404).json({ message: "Quiz not found" });

    await questionModel.deleteMany({ quiz: id });

    res.status(200).json({ message: "Quiz and related questions deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting quiz" });
  }
};


export const checkAnswer = async (req, res) => {
  try {
    const { id } = req.params; // quizId
    const { userId, answers } = req.body;

    const quiz = await quizModel.findById(id).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    const results = [];

    const questionIds = answers.map(a => a.questionId);
    const questions = await questionModel.find({ _id: { $in: questionIds } });

    for (const ans of answers) {
      const question = questions.find(q => q._id.toString() === ans.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer === ans.selectedOption;
      if (isCorrect) score++;

      results.push({
        question: question.text,
        selected: ans.selectedOption,
        correct: question.correctAnswer,
        isCorrect
      });
    }

    const maxScore = quiz.questions.length;
    const percentage = ((score / maxScore) * 100).toFixed(2);
    const status = percentage >= 70 ? "passed" : "failed";

    // --- Save grade attempt ---
    let grade = await gradeModel.findOne({ user: userId, quiz: id });

    if (grade) {
      grade.score = score;
      grade.maxScore = maxScore;
      grade.status = status;
      grade.attempt += 1;
      await grade.save();
    } else {
      grade = new gradeModel({
        user: userId,
        quiz: id,
        score,
        maxScore,
        status,
        attempt: 1
      });
      await grade.save();
    }

    // --- Mark module progress if passed ---
    if (status === "passed") {
      const moduleId = quiz.module;
      let progress = await moduleProgressModel.findOne({ user: userId, module: moduleId });

      if (progress) {
        progress.status = "completed";
        progress.completedAt = new Date();
        await progress.save();
      } else {
        await moduleProgressModel.create({
          user: userId,
          module: moduleId,
          status: "completed",
          completedAt: new Date()
        });
      }

      // --- Check if all modules in the course are completed ---
      const module = await moduleModel.findById(moduleId);
      if (module) {
        const courseId = module.course;

        // Total modules in course
        const allModules = await moduleModel.find({ course: courseId }).select("_id");
        const completedModules = await moduleProgressModel.find({
          user: userId,
          module: { $in: allModules.map(m => m._id) },
          status: "completed"
        });

        if (completedModules.length === allModules.length) {
          let courseProgress = await courseProgressModel.findOne({ user: userId, course: courseId });

          if (courseProgress) {
            courseProgress.status = "completed";
            courseProgress.completedAt = new Date();
            await courseProgress.save();
          } else {
            await courseProgressModel.create({
              user: userId,
              course: courseId,
              status: "completed",
              completedAt: new Date()
            });
          }
        }
      }
    }

    res.status(200).json({
      message: "Quiz evaluated successfully",
      quiz: quiz.title,
      score,
      maxScore,
      percentage,
      status,
      attempt: grade.attempt,
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking answers" });
  }
};