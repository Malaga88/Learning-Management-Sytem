import quizModel from "../models/quizModel.mjs";

export const createQuiz = async (req, res) => {
    try {
        const { lesson, question, options, answer } = req.body;
        const newQuiz = new quizModel({ lesson, question, options, answer });
        await newQuiz.save();
        res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating quiz" });
    }
};

export const getQuizzes = async (req, res) => {
    try {
        const quizzes = await quizModel.find();
        res.status(200).json({ message: "Quizzes retrieved successfully", quizzes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving quizzes" });
    }
};

export const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const quiz = await quizModel.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json({ message: "Quiz retrieved successfully", quiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving quiz" });
    }
};

export const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { lesson, question, options, answer } = req.body;
        const updatedQuiz = await quizModel.findByIdAndUpdate(id, { lesson, question, options, answer }, { new: true });
        if (!updatedQuiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json({ message: "Quiz updated successfully", quiz: updatedQuiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating quiz" });
    }
};

export  const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQuiz = await quizModel.findByIdAndDelete(id);
        if (!deletedQuiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting quiz" });
    }
};

export const checkAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { selectedOption } = req.body;
        const quiz = await quizModel.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        const isCorrect = quiz.answer === selectedOption;
        res.status(200).json({ message: "Answer checked successfully", isCorrect });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error checking answer" });
    }
};
