import express from "express";
import { 
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    publishCourse
} from "../controllers/courseController.mjs";
import { verifyToken, authorize, optionalAuth } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";
import courseModel from "../models/courseModel.mjs";

const courseRouter = express.Router();

// Public routes
courseRouter.get("/", optionalAuth, getCourses);
courseRouter.get("/:id", optionalAuth, getCourseById);

// Protected routes - Course creation and management
courseRouter.post("/",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.createCourse),
    createCourse
);

courseRouter.put("/:id",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.updateCourse),
    updateCourse
);

courseRouter.delete("/:id",
    verifyToken,
    authorize('instructor', 'admin'),
    deleteCourse
);

courseRouter.patch("/:id/publish",
    verifyToken,
    authorize('instructor', 'admin'),
    publishCourse
);

export default courseRouter;