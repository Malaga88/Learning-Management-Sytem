import express from 'express';
import {
    getDashboardStats,
    getCourseAnalytics,
    getSystemAnalytics
} from '../controllers/analyticsController.mjs';
import { verifyToken, authorize } from '../middleware/auth.mjs';

const analyticsRouter = express.Router();

// All routes require authentication
analyticsRouter.use(verifyToken);

// Dashboard statistics (all authenticated users)
analyticsRouter.get('/dashboard', getDashboardStats);

// Course analytics (instructors and admins)
analyticsRouter.get('/course/:courseId',
    authorize('instructor', 'admin'),
    getCourseAnalytics
);

// System analytics (admin only)
analyticsRouter.get('/system',
    authorize('admin'),
    getSystemAnalytics
);

export default analyticsRouter;