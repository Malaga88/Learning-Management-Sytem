import express from "express";
import {
  submitGrade,
  getUserGrades,
  getQuizGrades,
  getUserQuizGrade,
} from "../controllers/gradeController.js";

const router = express.Router();

// POST /api/grades → submit grade
router.post("/", submitGrade);

// GET /api/grades/user/:userId → all grades for user
router.get("/user/:userId", getUserGrades);

// GET /api/grades/quiz/:quizId → all grades for a quiz
router.get("/quiz/:quizId", getQuizGrades);

// GET /api/grades/:userId/:quizId → one grade
router.get("/:userId/:quizId", getUserQuizGrade);

export default gradeRoute;
