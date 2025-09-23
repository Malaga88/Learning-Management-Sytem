import analyticsService from '../services/analyticsService.mjs';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const stats = await analyticsService.getDashboardStats(req.user.id, req.user.role);
        
        res.json({
            success: true,
            message: 'Dashboard statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving dashboard statistics'
        });
    }
};

// Get course analytics (instructors and admins only)
export const getCourseAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Verify course access
        if (req.user.role !== 'admin') {
            const course = await courseModel.findById(courseId);
            if (!course || course.instructor.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }
        
        const analytics = await analyticsService.getCourseAnalytics(courseId);
        
        res.json({
            success: true,
            message: 'Course analytics retrieved successfully',
            data: analytics
        });
    } catch (error) {
        console.error('Course analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving course analytics'
        });
    }
};

// Get system analytics (admin only)
export const getSystemAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        // This would include more detailed system metrics
        // Implementation depends on your specific analytics needs
        
        res.json({
            success: true,
            message: 'System analytics retrieved successfully',
            data: {
                period,
                message: 'System analytics implementation can be customized based on needs'
            }
        });
    } catch (error) {
        console.error('System analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving system analytics'
        });
    }
};