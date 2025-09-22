import express from "express";
import { verifyToken, authorize } from "../middleware/auth.mjs";
import validate from "../middleware/validate.mjs";
import asyncHandler from "../middleware/asyncHandler.mjs";
import { createCourse, getCourses, getCourse, updateCourse, deleteCourse } from "../controllers/courseController.mjs";
import { createCourseSchema, updateCourseSchema } from "../validators/courseValidator.mjs";

const courseRouter = express.Router();

courseRouter
  .route("/")
  .get(asyncHandler(getCourses))
  .post(verifyToken, authorize("instructor", "admin"), validate(createCourseSchema), asyncHandler(createCourse));

courseRouter
  .route("/:id")
  .get(asyncHandler(getCourse))
  .patch(verifyToken, authorize("instructor", "admin"), validate(updateCourseSchema), asyncHandler(updateCourse))
  .delete(verifyToken, authorize("instructor", "admin"), asyncHandler(deleteCourse));

export default courseRouter;
