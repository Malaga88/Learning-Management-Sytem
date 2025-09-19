import express from "express";
import Question from "../models/questionModel.mjs";

const questionRouter = express.Router();

// Add a question to a quiz
questionRouter.post("/", async (req, res) => {
  try {
    const { quizId, text, options, correctAnswer } = req.body;
    const newQuestion = new Question({ quiz: quizId, text, options, correctAnswer });
    await newQuestion.save();
    res.status(201).json({ message: "Question created", question: newQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating question" });
  }
});

// Get questions for a quiz
questionRouter.get("/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    const questions = await Question.find({ quiz: quizId });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

export default questionRouter;
