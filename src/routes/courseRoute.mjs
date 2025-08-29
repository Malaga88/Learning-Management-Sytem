import express from "express";
import { Router } from "express";
import { createCourse } from "../controllers/courseController.mjs";
import { getCourses } from "../controllers/courseController.mjs";
import { getCourseById } from "../controllers/courseController.mjs";

const courseRouter = Router();

courseRouter.post("/", createCourse);
courseRouter.get("/", getCourses);
courseRouter.get("/:id", getCourseById);

export default courseRouter;
