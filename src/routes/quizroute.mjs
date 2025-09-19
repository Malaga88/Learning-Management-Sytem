import express from "express";
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  checkAnswer
} from "../controllers/quizController.mjs";

const quizRouter = express.Router();

// Create a new quiz
quizRouter.post("/", createQuiz);

// Get all quizzes
quizRouter.get("/", getQuizzes);

// Get quiz by ID
quizRouter.get("/:id", getQuizById);

// Update quiz
quizRouter.put("/:id", updateQuiz);

// Delete quiz
quizRouter.delete("/:id", deleteQuiz);

// Check answer for a quiz
quizRouter.post("/:id/check", checkAnswer);

export default quizRouter;
