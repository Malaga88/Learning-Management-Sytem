import express from "express";
import { Router } from "express";
import { createQuiz } from "../controllers/quizController.mjs";
import { getQuizById } from "../controllers/quizController.mjs";
import { updateQuiz } from "../controllers/quizController.mjs";
import { deleteQuiz } from "../controllers/quizController.mjs";
import { getQuizzes } from "../controllers/quizController.mjs";
import { checkAnswer } from "../controllers/quizController.mjs";

const quizRouter = Router();

quizRouter.post("/create-quiz", createQuiz);
quizRouter.get("/view-quizzes", getQuizzes);
quizRouter.get("/view-quiz/:id", getQuizById);
quizRouter.put("/update-quiz/:id", updateQuiz);
quizRouter.delete("/delete-quiz/:id", deleteQuiz);
quizRouter.post("/check-answer/:id", checkAnswer);

export default quizRouter;