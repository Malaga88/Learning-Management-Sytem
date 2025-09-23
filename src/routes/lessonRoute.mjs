import express from "express";
import {
    createLesson,
    getCourseLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    toggleLessonPublish,
    reorderLessons,
    duplicateLesson,
    getLessonStats,
    bulkUpdateLessons
} from "../controllers/lessonController.mjs";
import { verifyToken, authorize, optionalAuth } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";

const lessonRouter = express.Router();

// Public/Student routes
lessonRouter.get("/course/:courseId", optionalAuth, getCourseLessons);
lessonRouter.get("/:lessonId", optionalAuth, getLessonById);

// Instructor/Admin routes
lessonRouter.post("/",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.createLesson),
    createLesson
);

lessonRouter.put("/:lessonId",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.updateLesson),
    updateLesson
);

lessonRouter.delete("/:lessonId",
    verifyToken,
    authorize('instructor', 'admin'),
    deleteLesson
);

lessonRouter.patch("/:lessonId/publish",
    verifyToken,
    authorize('instructor', 'admin'),
    toggleLessonPublish
);

lessonRouter.put("/course/:courseId/reorder",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.reorderLessons),
    reorderLessons
);

lessonRouter.post("/:lessonId/duplicate",
    verifyToken,
    authorize('instructor', 'admin'),
    duplicateLesson
);

lessonRouter.get("/course/:courseId/stats",
    verifyToken,
    authorize('instructor', 'admin'),
    getLessonStats
);

lessonRouter.patch("/bulk-update",
    verifyToken,
    authorize('instructor', 'admin'),
    bulkUpdateLessons
);

export default lessonRouter;
