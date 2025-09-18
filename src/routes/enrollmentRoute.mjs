import express from "express";
import {
  enrollUser,
  updateProgress,
  getUserEnrollments,
  dropCourse,
} from "../controllers/enrollmentController.js";

const router = express.Router();


router.post("/", enrollUser);
router.patch("/:enrollmentId/progress", updateProgress);
router.get("/user/:userId", getUserEnrollments);
router.patch("/:enrollmentId/drop", dropCourse);

export default router;
