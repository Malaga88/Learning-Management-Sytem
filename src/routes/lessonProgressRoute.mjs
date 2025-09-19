import express from "express";
import { markLessonComplete, getUserCourseProgress } from "../controllers/lessonProgressController.mjs";

const router = express.Router();

// Mark a lesson as complete
router.post("/complete", markLessonComplete);

// Get progress + percentage for a user in a course
router.get("/:userId/course/:courseId", getUserCourseProgress);

export default router;
