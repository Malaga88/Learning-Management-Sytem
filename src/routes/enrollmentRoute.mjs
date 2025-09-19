import express from "express";
import {
  enrollInCourse,
  updateProgress,
  getUserEnrollments,
  dropCourse,
} from "../controllers/enrollmentController.mjs";

const enrollmentRouter = express.Router();

enrollmentRouter.post("/", enrollInCourse);
enrollmentRouter.patch("/:enrollmentId/progress", updateProgress);
enrollmentRouter.get("/user/:userId", getUserEnrollments);
enrollmentRouter.patch("/:enrollmentId/drop", dropCourse);

export default enrollmentRouter;
