import express from 'express';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    sendAnnouncement
} from '../controllers/notificationController.mjs';
import { verifyToken, authorize } from '../middleware/auth.mjs';

const notificationRouter = express.Router();

// All routes require authentication
notificationRouter.use(verifyToken);

// Get user notifications
notificationRouter.get('/', getUserNotifications);

// Mark notification as read
notificationRouter.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
notificationRouter.patch('/mark-all-read', markAllNotificationsAsRead);

// Send announcement (admin only)
notificationRouter.post('/announcement',
    authorize('admin'),
    sendAnnouncement
);

export default notificationRouter;