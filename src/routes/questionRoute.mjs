
// src/middleware/validation.mjs
import Joi from 'joi';

// Generic validation middleware
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });
        
        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }
        
        req.body = value; // Use validated and sanitized data
        next();
    };
};

// Validation schemas
export const schemas = {
    // Auth schemas
    register: Joi.object({
        name: Joi.string().trim().min(2).max(50).required(),
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().min(6).max(128).required(),
        role: Joi.string().valid('student', 'instructor', 'admin').default('student')
    }),
    
    login: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().required()
    }),
    
    updateProfile: Joi.object({
        name: Joi.string().trim().min(2).max(50),
        bio: Joi.string().trim().max(500).allow(''),
        profilePicture: Joi.string().uri().allow('')
    }),
    
    // Course schemas
    createCourse: Joi.object({
        title: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().max(1000).required(),
        category: Joi.string().trim().max(50).allow(''),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
        tags: Joi.array().items(Joi.string().trim().max(30)).max(10),
        price: Joi.number().min(0).default(0),
        duration: Joi.number().min(0),
        maxStudents: Joi.number().min(1).default(1000),
        requirements: Joi.array().items(Joi.string().trim().max(200)).max(20),
        learningOutcomes: Joi.array().items(Joi.string().trim().max(200)).max(20),
        thumbnailUrl: Joi.string().uri().allow(''),
        instructorEmail: Joi.string().email()
    }),
    
    updateCourse: Joi.object({
        title: Joi.string().trim().min(3).max(100),
        description: Joi.string().trim().max(1000),
        category: Joi.string().trim().max(50).allow(''),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
        tags: Joi.array().items(Joi.string().trim().max(30)).max(10),
        price: Joi.number().min(0),
        duration: Joi.number().min(0),
        maxStudents: Joi.number().min(1),
        requirements: Joi.array().items(Joi.string().trim().max(200)).max(20),
        learningOutcomes: Joi.array().items(Joi.string().trim().max(200)).max(20),
        thumbnailUrl: Joi.string().uri().allow(''),
        isPublished: Joi.boolean()
    }),
    
    // Lesson schemas
    createLesson: Joi.object({
        courseId: Joi.string().hex().length(24).required(),
        title: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().max(500).allow(''),
        content: Joi.string().required(),
        videoUrl: Joi.string().uri().allow(''),
        videoDuration: Joi.number().min(0),
        order: Joi.number().min(1),
        resources: Joi.array().items(Joi.object({
            name: Joi.string().trim().max(100).required(),
            url: Joi.string().uri().required(),
            type: Joi.string().valid('pdf', 'video', 'link', 'document', 'other').default('other')
        })).max(20),
        estimatedDuration: Joi.number().min(1),
        isFree: Joi.boolean().default(false)
    }),
    
    updateLesson: Joi.object({
        title: Joi.string().trim().min(3).max(100),
        description: Joi.string().trim().max(500).allow(''),
        content: Joi.string(),
        videoUrl: Joi.string().uri().allow(''),
        videoDuration: Joi.number().min(0),
        order: Joi.number().min(1),
        resources: Joi.array().items(Joi.object({
            name: Joi.string().trim().max(100).required(),
            url: Joi.string().uri().required(),
            type: Joi.string().valid('pdf', 'video', 'link', 'document', 'other').default('other')
        })).max(20),
        estimatedDuration: Joi.number().min(1),
        isFree: Joi.boolean(),
        isPublished: Joi.boolean()
    }),
    
    reorderLessons: Joi.object({
        lessonOrders: Joi.array().items(Joi.object({
            lessonId: Joi.string().hex().length(24).required(),
            order: Joi.number().min(1).required()
        })).min(1).required()
    }),
    
    // Quiz schemas
    createQuiz: Joi.object({
        courseId: Joi.string().hex().length(24).required(),
        title: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().max(500).allow(''),
        timeLimit: Joi.number().min(1).max(480),
        passingScore: Joi.number().min(0).max(100).default(60),
        maxAttempts: Joi.number().min(1).default(3),
        shuffleQuestions: Joi.boolean().default(false),
        showCorrectAnswers: Joi.boolean().default(true),
        allowReview: Joi.boolean().default(true),
        order: Joi.number().min(1),
        questions: Joi.array().items(Joi.object({
            text: Joi.string().trim().min(5).max(1000).required(),
            type: Joi.string().valid('multiple-choice', 'true-false', 'fill-in-blank').default('multiple-choice'),
            options: Joi.array().items(Joi.object({
                text: Joi.string().trim().max(200).required(),
                isCorrect: Joi.boolean().default(false)
            })).min(2).max(6),
            correctAnswer: Joi.number().min(0),
            points: Joi.number().min(1).default(1),
            explanation: Joi.string().trim().max(500).allow(''),
            difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
            order: Joi.number().min(1)
        }))
    }),
    
    // Question schemas
    createQuestion: Joi.object({
        text: Joi.string().trim().min(5).max(1000).required(),
        type: Joi.string().valid('multiple-choice', 'true-false', 'fill-in-blank').default('multiple-choice'),
        options: Joi.array().items(Joi.object({
            text: Joi.string().trim().max(200).required(),
            isCorrect: Joi.boolean().default(false)
        })).min(2).max(6),
        correctAnswer: Joi.number().min(0),
        points: Joi.number().min(1).default(1),
        explanation: Joi.string().trim().max(500).allow(''),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
        order: Joi.number().min(1)
    }),
    
    // Enrollment schemas
    enrollInCourse: Joi.object({
        userId: Joi.string().hex().length(24).required(),
        courseId: Joi.string().hex().length(24).required(),
        paymentAmount: Joi.number().min(0).default(0)
    }),
    
    // Progress schemas
    updateLessonProgress: Joi.object({
        userId: Joi.string().hex().length(24).required(),
        lessonId: Joi.string().hex().length(24).required(),
        progress: Joi.number().min(0).max(100).default(100),
        timeSpent: Joi.number().min(0).default(0),
        notes: Joi.string().max(2000).allow(''),
        bookmarks: Joi.array().items(Joi.object({
            timestamp: Joi.number().min(0).required(),
            note: Joi.string().max(200).allow('')
        })).max(50)
    }),
    
    // Quiz attempt schema
    submitQuizAttempt: Joi.object({
        answers: Joi.array().items(Joi.object({
            questionId: Joi.string().hex().length(24).required(),
            selectedAnswer: Joi.alternatives().try(
                Joi.number(),
                Joi.string(),
                Joi.boolean()
            ).required(),
            timeSpent: Joi.number().min(0).default(0)
        })).required(),
        timeSpent: Joi.number().min(0).default(0),
        userAgent: Joi.string().max(500).allow('')
    })
};

// src/middleware/rateLimiting.mjs
import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Quiz submission limiter
export const quizLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3, // limit each IP to 3 quiz submissions per minute
    message: {
        success: false,
        message: 'Too many quiz submissions, please wait before trying again'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// src/middleware/errorHandler.mjs
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationErrors
        });
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid resource ID'
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }
    
    // Default error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};

// src/middleware/logging.mjs
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || 'anonymous',
            timestamp: new Date().toISOString()
        };
        
        // Log to console (in production, use proper logging service)
        console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.status} - ${logData.duration} - ${logData.ip} - ${logData.userId}`);
    });
    
    next();
};

// ===== UPDATED ROUTES =====
// src/routes/authRoute.mjs
import express from "express";
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile 
} from "../controllers/authController.mjs";
import { verifyToken } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";
import { authLimiter } from "../middleware/rateLimiting.mjs";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", 
    authLimiter,
    validate(schemas.register),
    registerUser
);

authRouter.post("/login", 
    authLimiter,
    validate(schemas.login),
    loginUser
);

// Protected routes
authRouter.get("/profile", 
    verifyToken, 
    getUserProfile
);

authRouter.put("/profile", 
    verifyToken,
    validate(schemas.updateProfile),
    updateUserProfile
);

export default authRouter;

// src/routes/courseRoute.mjs
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

// src/routes/lessonRoute.mjs
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

// src/routes/quizRoute.mjs
import express from "express";
import {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    submitQuizAttempt
} from "../controllers/quizController.mjs";
import { verifyToken, authorize, optionalAuth } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";
import { quizLimiter } from "../middleware/rateLimiting.mjs";

const quizRouter = express.Router();

// Public/Student routes
quizRouter.get("/", optionalAuth, getQuizzes);
quizRouter.get("/:id", optionalAuth, getQuizById);

// Protected student routes
quizRouter.post("/:id/submit",
    verifyToken,
    quizLimiter,
    validate(schemas.submitQuizAttempt),
    submitQuizAttempt
);

// Instructor/Admin routes
quizRouter.post("/",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.createQuiz),
    createQuiz
);

quizRouter.put("/:id",
    verifyToken,
    authorize('instructor', 'admin'),
    updateQuiz
);

quizRouter.delete("/:id",
    verifyToken,
    authorize('instructor', 'admin'),
    deleteQuiz
);

export default quizRouter;

// src/routes/questionRoute.mjs
import express from "express";
import {
    addQuestion,
    getQuizQuestions,
    updateQuestion,
    deleteQuestion,
    checkAnswer
} from "../controllers/questionController.mjs";
import { verifyToken, authorize, optionalAuth } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";

const questionRouter = express.Router();

// Public routes (for taking quizzes)
questionRouter.get("/quiz/:quizId", optionalAuth, getQuizQuestions);

// Student routes (for practice)
questionRouter.post("/:questionId/check",
    verifyToken,
    checkAnswer
);

// Instructor/Admin routes
questionRouter.post("/quiz/:quizId",
    verifyToken,
    authorize('instructor', 'admin'),
    validate(schemas.createQuestion),
    addQuestion
);

questionRouter.put("/:questionId",
    verifyToken,
    authorize('instructor', 'admin'),
    updateQuestion
);

questionRouter.delete("/:questionId",
    verifyToken,
    authorize('instructor', 'admin'),
    deleteQuestion
);

export default questionRouter;

// src/routes/enrollmentRoute.mjs
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

// src/routes/lessonProgressRoute.mjs
import express from "express";
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

// src/routes/gradeRoute.mjs
import express from "express";
import {
    submitGrade,
    getGrades,
    getQuizGrade,
    getUserQuizGrade
} from "../controllers/gradeController.mjs";
import { verifyToken, authorize } from "../middleware/auth.mjs";

const gradeRouter = express.Router();

// Deprecated route
gradeRouter.post("/", verifyToken, submitGrade);

// Student routes
gradeRouter.get("/user/:userId",
    verifyToken,
    getGrades
);

gradeRouter.get("/:userId/:quizId",
    verifyToken,
    getUserQuizGrade
);

// Instructor/Admin routes
gradeRouter.get("/quiz/:quizId",
    verifyToken,
    authorize('instructor', 'admin'),
    getQuizGrade
);

export default gradeRouter;

// ===== UPDATED APP.MJS =====
// app.mjs
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import authRouter from './src/routes/authRoute.mjs';
import courseRouter from './src/routes/courseRoute.mjs';
import lessonRouter from './src/routes/lessonRoute.mjs';
import quizRouter from './src/routes/quizRoute.mjs';
import questionRouter from './src/routes/questionRoute.mjs';
import enrollmentRouter from './src/routes/enrollmentRoute.mjs';
import gradeRouter from './src/routes/gradeRoute.mjs';
import lessonProgressRouter from './src/routes/lessonProgressRoute.mjs';

// Import middleware
import { generalLimiter } from './src/middleware/rateLimiting.mjs';
import { errorHandler } from './src/middleware/errorHandler.mjs';
import { requestLogger } from './src/middleware/logging.mjs';
import connectToMongoDB from './src/lib/db.mjs';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// Connect to MongoDB
connectToMongoDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for production deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use(generalLimiter);

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the LMS API!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            courses: '/api/v1/courses',
            lessons: '/api/v1/lessons',
            quizzes: '/api/v1/quizzes',
            questions: '/api/v1/questions',
            enroll