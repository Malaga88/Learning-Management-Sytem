import express from "express";
import { Router } from "express";
import { createCourse, 
    getCourses,
    getCourseById
 } from "../controllers/courseController.mjs";

const courseRouter = Router();

courseRouter.post("/create-course", createCourse);
courseRouter.get("/view-courses", getCourses);
courseRouter.get("/view-course/:id", getCourseById);

export default courseRouter;
