import emailService from './emailService.mjs';
import userModel from '../models/userModel.mjs';

class NotificationService {
    constructor() {
        this.notifications = []; // In-memory storage for real-time notifications
    }

    // Create in-app notification
    async createNotification(userId, title, message, type = 'info', data = null) {
        const notification = {
            id: Date.now().toString(),
            userId,
            title,
            message,
            type, // 'info', 'success', 'warning', 'error'
            data,
            read: false,
            createdAt: new Date()
        };

        this.notifications.push(notification);
        
        // Keep only last 100 notifications per user
        this.notifications = this.notifications
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 100)
            .concat(this.notifications.filter(n => n.userId !== userId));

        return notification;
    }

    // Get user notifications
    getUserNotifications(userId, limit = 20) {
        return this.notifications
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    // Mark notification as read
    markAsRead(userId, notificationId) {
        const notification = this.notifications.find(
            n => n.id === notificationId && n.userId === userId
        );
        if (notification) {
            notification.read = true;
        }
        return notification;
    }

    // Mark all notifications as read
    markAllAsRead(userId) {
        const userNotifications = this.notifications.filter(n => n.userId === userId);
        userNotifications.forEach(n => n.read = true);
        return userNotifications.length;
    }

    // Send notification with email if user preferences allow
    async sendNotification(userId, title, message, type = 'info', options = {}) {
        try {
            const user = await userModel.findById(userId);
            if (!user) return;

            // Create in-app notification
            const notification = await this.createNotification(userId, title, message, type, options.data);

            // Send email if enabled in user preferences
            if (user.preferences?.notifications?.email && options.sendEmail) {
                const emailHtml = this.generateEmailTemplate(title, message, type, options);
                await emailService.sendEmail(user.email, title, emailHtml);
            }

            return notification;
        } catch (error) {
            console.error('Notification sending error:', error);
        }
    }

    // Generate email template for notifications
    generateEmailTemplate(title, message, type, options = {}) {
        const colors = {
            info: '#3498db',
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c'
        };

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        return `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: ${colors[type]}; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0;">${icons[type]} ${title}</h2>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    ${message}
                </p>
                
                ${options.actionUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${options.actionUrl}" 
                       style="background: ${colors[type]}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        ${options.actionText || 'View Details'}
                    </a>
                </div>
                ` : ''}
            </div>
            
            <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'LMS Platform'}. All rights reserved.</p>
            </div>
        </div>`;
    }

    // Bulk notifications (for announcements)
    async sendBulkNotification(userIds, title, message, type = 'info', options = {}) {
        const results = [];
        
        for (const userId of userIds) {
            try {
                const result = await this.sendNotification(userId, title, message, type, options);
                results.push({ userId, success: true, notification: result });
            } catch (error) {
                results.push({ userId, success: false, error: error.message });
            }
        }
        
        return results;
    }

    // Course-specific notifications
    async notifyCourseUpdate(courseId, title, message, instructorId) {
        try {
            const enrollments = await enrollmentModel.find({ 
                course: courseId, 
                status: 'active' 
            }).populate('user');
            
            const userIds = enrollments
                .filter(e => e.user.preferences?.notifications?.courseUpdates !== false)
                .map(e => e.user._id.toString());
            
            return await this.sendBulkNotification(
                userIds, 
                title, 
                message, 
                'info',
                { 
                    sendEmail: true,
                    actionUrl: `${process.env.FRONTEND_URL}/courses/${courseId}`,
                    actionText: 'View Course'
                }
            );
        } catch (error) {
            console.error('Course notification error:', error);
        }
    }
}

export default new NotificationService();
