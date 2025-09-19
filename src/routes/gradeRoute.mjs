import express from "express";
import {
  submitGrade,
  getGrades,
  getQuizGrade,
  getUserQuizGrade,
} from "../controllers/gradeController.mjs";

const gradeRouter = express.Router();

// POST /api/grades → submit grade
gradeRouter.post("/", submitGrade);

// GET /api/grades/user/:userId → all grades for user
gradeRouter.get("/user/:userId", getGrades);

// GET /api/grades/quiz/:quizId → all grades for a quiz
gradeRouter.get("/quiz/:quizId", getQuizGrade);

// GET /api/grades/:userId/:quizId → one grade
gradeRouter.get("/:userId/:quizId", getUserQuizGrade);

export default gradeRouter;
