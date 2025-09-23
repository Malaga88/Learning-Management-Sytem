import express from "express";
import {
    enrollInCourse,
    updateProgress,
    getUserEnrollments,
    dropCourse,
    getCourseEnrollments
} from "../controllers/enrollmentController.mjs";
import { verifyToken, authorize } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";

const enrollmentRouter = express.Router();

// Student routes
enrollmentRouter.post("/",
    verifyToken,
    validate(schemas.enrollInCourse),
    enrollInCourse
);

enrollmentRouter.patch("/:enrollmentId/progress",
    verifyToken,
    updateProgress
);

enrollmentRouter.get("/user/:userId",
    verifyToken,
    getUserEnrollments
);

enrollmentRouter.patch("/:enrollmentId/drop",
    verifyToken,
    dropCourse
);

// Instructor/Admin routes
enrollmentRouter.get("/course/:courseId",
    verifyToken,
    authorize('instructor', 'admin'),
    getCourseEnrollments
);

export default enrollmentRouter;
