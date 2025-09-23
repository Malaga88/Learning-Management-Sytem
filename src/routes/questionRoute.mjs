import express from "express";
import {
    addQuestion,
    getQuizQuestions,
    updateQuestion,
    deleteQuestion,
    checkAnswer
} from "../controllers/questionController.mjs";
import { verifyToken, authorize, optionalAuth } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";

const questionRouter = express.Router();

// Public routes (for taking quizzes)
questionRouter.get("/quiz/:quizId", optionalAuth, getQuizQuestions);

// Student routes (for practice)
questionRouter.post("/:questionId/check",
    verifyToken,
    checkAnswer
);

// Instructor/Admin routes
questionRouter.post("/quiz/:quizId",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.createQuestion),
    addQuestion
);

questionRouter.put("/:questionId",
    verifyToken,
    authorize('instructor', 'admin'),
    updateQuestion
);

questionRouter.delete("/:questionId",
    verifyToken,
    authorize('instructor', 'admin'),
    deleteQuestion
);

export default questionRouter;
