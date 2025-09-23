import notificationService from '../services/notificationService.mjs';
import { authorize } from '../middleware/auth.mjs';

// Get user notifications
export const getUserNotifications = async (req, res) => {
    try {
        const { limit = 20, unreadOnly = false } = req.query;
        const userId = req.user.id;
        
        let notifications = notificationService.getUserNotifications(userId, parseInt(limit));
        
        if (unreadOnly === 'true') {
            notifications = notifications.filter(n => !n.read);
        }
        
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const notification = notificationService.markAsRead(userId, notificationId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Mark notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = notificationService.markAllAsRead(userId);
        
        res.json({
            success: true,
            message: `${count} notifications marked as read`
        });
    } catch (error) {
        console.error('Mark all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notifications as read'
        });
    }
};

// Send announcement (admin only)
export const sendAnnouncement = async (req, res) => {
    try {
        const { title, message, targetUsers = 'all', courseId } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }
        
        let userIds = [];
        
        if (targetUsers === 'all') {
            const users = await userModel.find({ isActive: true }).select('_id');
            userIds = users.map(u => u._id.toString());
        } else if (courseId) {
            const enrollments = await enrollmentModel.find({ 
                course: courseId, 
                status: 'active' 
            });
            userIds = enrollments.map(e => e.user.toString());
        } else if (Array.isArray(targetUsers)) {
            userIds = targetUsers;
        }
        
        const results = await notificationService.sendBulkNotification(
            userIds,
            title,
            message,
            'info',
            { sendEmail: true }
        );
        
        res.json({
            success: true,
            message: `Announcement sent to ${userIds.length} users`,
            data: {
                totalSent: results.filter(r => r.success).length,
                totalFailed: results.filter(r => !r.success).length
            }
        });
    } catch (error) {
        console.error('Send announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending announcement'
        });
    }
};