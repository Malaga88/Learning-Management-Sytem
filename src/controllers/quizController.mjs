import quizModel from "../models/quizModel.mjs";
import questionModel from "../models/questionModel.mjs";

// Create a new quiz with optional questions
export const createQuiz = async (req, res) => {
    try {
        const { moduleId, title, description, timeLimit, questions } = req.body;

        // Create quiz
        const newQuiz = new quizModel({ module: moduleId, title, description, timeLimit });
        await newQuiz.save();

        // If questions are provided, create and link them
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

// Get all quizzes
export const getQuizzes = async (req, res) => {
    try {
        const quizzes = await quizModel.find().populate("module").populate("questions");
        res.status(200).json({ message: "Quizzes retrieved successfully", quizzes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving quizzes" });
    }
};

// Get quiz by ID
export const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await quizModel.findById(id).populate("module").populate("questions");
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

// Delete quiz
export const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedQuiz = await quizModel.findByIdAndDelete(id);
        if (!deletedQuiz) return res.status(404).json({ message: "Quiz not found" });

        // Delete related questions too
        await questionModel.deleteMany({ quiz: id });

        res.status(200).json({ message: "Quiz and related questions deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting quiz" });
    }
};

// Check answers (for submission)
export const checkAnswer = async (req, res) => {
    try {
        const { id } = req.params; // quizId
        const { answers } = req.body; // { questionId: selectedOption }

        const quiz = await quizModel.findById(id).populate("questions");
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        let score = 0;
        quiz.questions.forEach(q => {
            if (answers[q._id] && answers[q._id] === q.correctAnswer) {
                score++;
            }
        });

        res.status(200).json({
            message: "Quiz submitted successfully",
            totalQuestions: quiz.questions.length,
            score,
            passed: score >= Math.ceil(quiz.questions.length * 0.6) // 60% pass mark
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error submitting quiz" });
    }
};
