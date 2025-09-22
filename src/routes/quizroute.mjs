import express from "express";
import { verifyToken, authorize } from "../middleware/auth.mjs";
import { quizLimiter } from "../middleware/rateLimit.mjs";
import validate from "../middleware/validate.mjs";
import asyncHandler from "../middleware/asyncHandler.mjs";
import { createQuizSchema, updateQuizSchema } from "../validators/quizValidator.mjs";
import { createQuiz, getQuizzes, getQuiz, updateQuiz, deleteQuiz, submitQuiz } from "../controllers/quizController.mjs";

const quizRouter = express.Router();

quizRouter
  .route("/")
  .get(asyncHandler(getQuizzes))
  .post(verifyToken, authorize("instructor", "admin"), validate(createQuizSchema), asyncHandler(createQuiz));

quizRouter
  .route("/:id")
  .get(asyncHandler(getQuiz))
  .patch(verifyToken, authorize("instructor", "admin"), validate(updateQuizSchema), asyncHandler(updateQuiz))
  .delete(verifyToken, authorize("instructor", "admin"), asyncHandler(deleteQuiz));

quizRouter.post("/:id/submit", verifyToken, quizLimiter, asyncHandler(submitQuiz));

export default quizRouter;
