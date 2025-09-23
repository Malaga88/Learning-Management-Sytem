import express from "express";
import {
    submitGrade,
    getGrades,
    getQuizGrade,
    getUserQuizGrade
} from "../controllers/gradeController.mjs";
import { verifyToken, authorize } from "../middleware/auth.mjs";

const gradeRouter = express.Router();

// Deprecated route
gradeRouter.post("/", verifyToken, submitGrade);

// Student routes
gradeRouter.get("/user/:userId",
    verifyToken,
    getGrades
);

gradeRouter.get("/:userId/:quizId",
    verifyToken,
    getUserQuizGrade
);

// Instructor/Admin routes
gradeRouter.get("/quiz/:quizId",
    verifyToken,
    authorize('instructor', 'admin'),
    getQuizGrade
);

export default gradeRouter;