import { 
    updateLessonProgress,
    markLessonComplete, 
    getUserCourseProgress,
    getLessonProgress
} from "../controllers/lessonProgressController.mjs";
import { verifyToken } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";

const lessonProgressRouter = express.Router();

// All routes require authentication
lessonProgressRouter.post("/update",
    verifyToken,
    validate(schemas.updateLessonProgress),
    updateLessonProgress
);

// Backward compatibility
lessonProgressRouter.post("/complete",
    verifyToken,
    markLessonComplete
);

lessonProgressRouter.get("/:userId/course/:courseId",
    verifyToken,
    getUserCourseProgress
);

lessonProgressRouter.get("/:userId/lesson/:lessonId",
    verifyToken,
    getLessonProgress
);

export default lessonProgressRouter;