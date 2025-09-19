import express from "express";
import { markLessonComplete, getUserCourseProgress } from "../controllers/lessonProgressController.mjs";

const lessonProgressRouter = express.Router();

// Mark a lesson as complete
lessonProgressRouter.post("/complete", markLessonComplete);

// Get progress + percentage for a user in a course
lessonProgressRouter.get("/:userId/course/:courseId", getUserCourseProgress);

export default lessonProgressRouter;
