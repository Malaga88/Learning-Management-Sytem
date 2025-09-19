import express from "express";
import {
  createLesson,
  getCourseLessons,
  getLessonById,
  updateLesson,
  deleteLesson
} from "../controllers/lessonController.mjs";

const lessonRouter = express.Router();

lessonRouter.post("/", createLesson);
lessonRouter.get("/course/:courseId", getCourseLessons);
lessonRouter.get("/:lessonId", getLessonById);
lessonRouter.put("/:lessonId", updateLesson);
lessonRouter.delete("/:lessonId", deleteLesson);

export default lessonRouter;
