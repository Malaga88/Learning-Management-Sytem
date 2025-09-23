import userModel from '../models/userModel.mjs';
import courseModel from '../models/courseModel.mjs';
import enrollmentModel from '../models/enrollmentModel.mjs';
import gradeModel from '../models/gradeModel.mjs';
import lessonProgressModel from '../models/lessonProgressModel.mjs';

class AnalyticsService {
    // Dashboard overview stats
    async getDashboardStats(userId, userRole) {
        try {
            const stats = {};
            
            if (userRole === 'admin') {
                stats.users = await this.getUserStats();
                stats.courses = await this.getCourseStats();
                stats.enrollments = await this.getEnrollmentStats();
                stats.revenue = await this.getRevenueStats();
            } else if (userRole === 'instructor') {
                stats.myCourses = await this.getInstructorCourseStats(userId);
                stats.myStudents = await this.getInstructorStudentStats(userId);
                stats.myRevenue = await this.getInstructorRevenueStats(userId);
            } else {
                stats.myProgress = await this.getStudentProgressStats(userId);
                stats.myCertificates = await this.getStudentCertificateStats(userId);
            }
            
            return stats;
        } catch (error) {
            console.error('Dashboard stats error:', error);
            return {};
        }
    }

    // User statistics
    async getUserStats() {
        const [total, active, byRole, recent] = await Promise.all([
            userModel.countDocuments(),
            userModel.countDocuments({ isActive: true }),
            userModel.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            userModel.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            })
        ]);

        return {
            total,
            active,
            byRole: byRole.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            newThisMonth: recent
        };
    }

    // Course statistics
    async getCourseStats() {
        const [total, published, byCategory, popular] = await Promise.all([
            courseModel.countDocuments(),
            courseModel.countDocuments({ isPublished: true }),
            courseModel.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            courseModel.find()
                .sort({ currentEnrollments: -1 })
                .limit(5)
                .select('title currentEnrollments')
        ]);

        return {
            total,
            published,
            topCategories: byCategory,
            mostPopular: popular
        };
    }

    // Enrollment statistics
    async getEnrollmentStats() {
        const [total, active, completed, recent] = await Promise.all([
            enrollmentModel.countDocuments(),
            enrollmentModel.countDocuments({ status: 'active' }),
            enrollmentModel.countDocuments({ status: 'completed' }),
            enrollmentModel.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            })
        ]);

        const completionRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;

        return {
            total,
            active,
            completed,
            completionRate,
            newThisMonth: recent
        };
    }

    // Revenue statistics
    async getRevenueStats() {
        const revenueData = await enrollmentModel.aggregate([
            { $match: { paymentStatus: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$paymentAmount' },
                    averageOrderValue: { $avg: '$paymentAmount' },
                    paidEnrollments: { $sum: 1 }
                }
            }
        ]);

        const monthlyRevenue = await enrollmentModel.aggregate([
            { 
                $match: { 
                    paymentStatus: 'completed',
                    createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$paymentAmount' },
                    enrollments: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        return {
            ...(revenueData[0] || { totalRevenue: 0, averageOrderValue: 0, paidEnrollments: 0 }),
            monthlyRevenue
        };
    }

    // Instructor-specific stats
    async getInstructorCourseStats(instructorId) {
        const courses = await courseModel.find({ instructor: instructorId });
        const courseIds = courses.map(c => c._id);

        const [totalEnrollments, completedEnrollments, averageRating] = await Promise.all([
            enrollmentModel.countDocuments({ course: { $in: courseIds } }),
            enrollmentModel.countDocuments({ 
                course: { $in: courseIds }, 
                status: 'completed' 
            }),
            courseModel.aggregate([
                { $match: { instructor: mongoose.Types.ObjectId(instructorId) } },
                { $group: { _id: null, avgRating: { $avg: '$rating.average' } } }
            ])
        ]);

        return {
            totalCourses: courses.length,
            publishedCourses: courses.filter(c => c.isPublished).length,
            totalEnrollments,
            completedEnrollments,
            averageRating: averageRating[0]?.avgRating || 0
        };
    }

    async getInstructorStudentStats(instructorId) {
        const courseIds = await courseModel.find({ instructor: instructorId }).distinct('_id');
        
        const studentStats = await enrollmentModel.aggregate([
            { $match: { course: { $in: courseIds } } },
            { $group: { _id: '$user' } },
            { $count: 'uniqueStudents' }
        ]);

        const activeStudents = await enrollmentModel.countDocuments({
            course: { $in: courseIds },
            status: 'active'
        });

        return {
            uniqueStudents: studentStats[0]?.uniqueStudents || 0,
            activeStudents
        };
    }

    async getInstructorRevenueStats(instructorId) {
        const courseIds = await courseModel.find({ instructor: instructorId }).distinct('_id');
        
        const revenueStats = await enrollmentModel.aggregate([
            { 
                $match: { 
                    course: { $in: courseIds },
                    paymentStatus: 'completed'
                } 
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$paymentAmount' },
                    paidEnrollments: { $sum: 1 }
                }
            }
        ]);

        return revenueStats[0] || { totalRevenue: 0, paidEnrollments: 0 };
    }

    // Student-specific stats
    async getStudentProgressStats(userId) {
        const [enrollments, completedCourses, totalLessonsCompleted] = await Promise.all([
            enrollmentModel.find({ user: userId }).populate('course', 'title'),
            enrollmentModel.countDocuments({ user: userId, status: 'completed' }),
            lessonProgressModel.countDocuments({ user: userId, status: 'completed' })
        ]);

        const totalProgress = enrollments.length > 0 ? 
            enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length : 0;

        return {
            totalCourses: enrollments.length,
            completedCourses,
            averageProgress: Math.round(totalProgress),
            totalLessonsCompleted,
            activeCourses: enrollments.filter(e => e.status === 'active').length
        };
    }

    async getStudentCertificateStats(userId) {
        const certificates = await enrollmentModel.countDocuments({
            user: userId,
            certificateIssued: true
        });

        return { totalCertificates: certificates };
    }

    // Course performance analytics
    async getCourseAnalytics(courseId) {
        const [
            course,
            enrollmentStats,
            progressStats,
            gradeStats,
            lessonStats
        ] = await Promise.all([
            courseModel.findById(courseId).populate('instructor', 'name'),
            this.getCourseEnrollmentAnalytics(courseId),
            this.getCourseProgressAnalytics(courseId),
            this.getCourseGradeAnalytics(courseId),
            this.getCourseLessonAnalytics(courseId)
        ]);

        return {
            course,
            enrollments: enrollmentStats,
            progress: progressStats,
            grades: gradeStats,
            lessons: lessonStats
        };
    }

    async getCourseEnrollmentAnalytics(courseId) {
        const enrollments = await enrollmentModel.find({ course: courseId });
        const total = enrollments.length;
        const completed = enrollments.filter(e => e.status === 'completed').length;
        const dropped = enrollments.filter(e => e.status === 'dropped').length;
        
        return {
            total,
            active: total - completed - dropped,
            completed,
            dropped,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
            dropoutRate: total > 0 ? ((dropped / total) * 100).toFixed(2) : 0
        };
    }

    async getCourseProgressAnalytics(courseId) {
        const progressData = await enrollmentModel.aggregate([
            { $match: { course: mongoose.Types.ObjectId(courseId) } },
            {
                $group: {
                    _id: null,
                    averageProgress: { $avg: '$progress' },
                    studentsOver50: { $sum: { $cond: [{ $gte: ['$progress', 50] }, 1, 0] } },
                    studentsOver80: { $sum: { $cond: [{ $gte: ['$progress', 80] }, 1, 0] } },
                    totalStudents: { $sum: 1 }
                }
            }
        ]);

        return progressData[0] || {
            averageProgress: 0,
            studentsOver50: 0,
            studentsOver80: 0,
            totalStudents: 0
        };
    }

    async getCourseGradeAnalytics(courseId) {
        const quizzes = await quizModel.find({ course: courseId }).distinct('_id');
        
        if (quizzes.length === 0) {
            return { averageScore: 0, passRate: 0, totalAttempts: 0 };
        }

        const gradeStats = await gradeModel.aggregate([
            { $match: { quiz: { $in: quizzes } } },
            {
                $group: {
                    _id: null,
                    averageScore: { $avg: '$bestPercentage' },
                    passedGrades: { $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] } },
                    totalGrades: { $sum: 1 },
                    totalAttempts: { $sum: '$totalAttempts' }
                }
            }
        ]);

        const stats = gradeStats[0] || { averageScore: 0, passedGrades: 0, totalGrades: 0, totalAttempts: 0 };
        stats.passRate = stats.totalGrades > 0 ? ((stats.passedGrades / stats.totalGrades) * 100).toFixed(2) : 0;

        return stats;
    }

    async getCourseLessonAnalytics(courseId) {
        const lessons = await lessonModel.find({ course: courseId });
        const lessonIds = lessons.map(l => l._id);

        const completionStats = await lessonProgressModel.aggregate([
            { $match: { lesson: { $in: lessonIds } } },
            {
                $group: {
                    _id: '$lesson',
                    completions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    totalViews: { $sum: 1 },
                    averageTimeSpent: { $avg: '$timeSpent' }
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'lesson'
                }
            },
            { $unwind: '$lesson' },
            {
                $project: {
                    lessonTitle: '$lesson.title',
                    completions: 1,
                    totalViews: 1,
                    averageTimeSpent: 1,
                    completionRate: { 
                        $multiply: [
                            { $divide: ['$completions', '$totalViews'] }, 
                            100
                        ] 
                    }
                }
            },
            { $sort: { 'lesson.order': 1 } }
        ]);

        return completionStats;
    }
}

export default new AnalyticsService();