import express from "express";
import {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    submitQuizAttempt
} from "../controllers/quizController.mjs";
import { verifyToken, authorize, optionalAuth } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";
import { quizLimiter } from "../middleware/rateLimiting.mjs";

const quizRouter = express.Router();

// Public/Student routes
quizRouter.get("/", optionalAuth, getQuizzes);
quizRouter.get("/:id", optionalAuth, getQuizById);

// Protected student routes
quizRouter.post("/:id/submit",
    verifyToken,
    quizLimiter,
    validate(schemas.submitQuizAttempt),
    submitQuizAttempt
);

// Instructor/Admin routes
quizRouter.post("/",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.createQuiz),
    createQuiz
);

quizRouter.put("/:id",
    verifyToken,
    authorize('instructor', 'admin'),
    updateQuiz
);

quizRouter.delete("/:id",
    verifyToken,
    authorize('instructor', 'admin'),
    deleteQuiz
);

export default quizRouter;