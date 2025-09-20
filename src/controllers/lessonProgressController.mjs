import lessonProgressModel from "../models/lessonProgressModel.mjs";
import lessonModel from "../models/lessonModel.mjs";
import enrollmentModel from "../models/enrollmentModel.mjs";

// Mark lesson as complete or update progress
export const updateLessonProgress = async (req, res) => {
    try {
        const { userId, lessonId, progress, timeSpent, notes, bookmarks } = req.body;
        
        // Ensure lesson exists
        const lesson = await lessonModel.findById(lessonId).populate("course");
        if (!lesson) {
            return res.status(404).json({ 
                success: false,
                message: "Lesson not found" 
            });
        }
        
        // Check if user is enrolled
        const enrollment = await enrollmentModel.findOne({ 
            user: userId, 
            course: lesson.course._id,
            status: 'active'
        });
        if (!enrollment) {
            return res.status(403).json({ 
                success: false,
                message: "You must be enrolled in this course to track progress" 
            });
        }
        
        // Update or create progress record
        const updateData = {
            progress: Math.min(progress || 100, 100),
            timeSpent: (timeSpent || 0),
            lastAccessedAt: new Date()
        };
        
        if (notes) updateData.notes = notes;
        if (bookmarks) updateData.bookmarks = bookmarks;
        
        // Determine status based on progress
        if (updateData.progress >= 100) {
            updateData.status = 'completed';
            updateData.completedAt = new Date();
        } else if (updateData.progress > 0) {
            updateData.status = 'in-progress';
        }
        
        const lessonProgress = await lessonProgressModel.findOneAndUpdate(
            { user: userId, lesson: lessonId },
            updateData,
            { new: true, upsert: true, runValidators: true }
        );
        
        // Update course enrollment progress
        await updateCourseProgress(userId, lesson.course._id);
        
        res.json({ 
            success: true,
            message: updateData.progress >= 100 ? "Lesson completed successfully" : "Progress updated successfully",
            data: lessonProgress
        });
    } catch (error) {
        console.error('Update lesson progress error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error updating lesson progress" 
        });
    }
};

// Mark lesson as complete (backward compatibility)
export const markLessonComplete = async (req, res) => {
    req.body.progress = 100;
    return updateLessonProgress(req, res);
};

// Get user progress for a course
export const getUserCourseProgress = async (req, res) => {
    try {
        const { userId, courseId } = req.params;
        
        const totalLessons = await lessonModel.countDocuments({ 
            course: courseId,
            isPublished: true 
        });
        
        if (totalLessons === 0) {
            return res.json({ 
                success: true,
                message: "No published lessons in this course", 
                data: {
                    totalLessons: 0,
                    completedCount: 0,
                    percentage: 0,
                    completedLessons: []
                }
            });
        }
        
        // Get all lesson progress for this course
        const lessonIds = await lessonModel.find({ 
            course: courseId, 
            isPublished: true 
        }).distinct("_id");
        
        const progressRecords = await lessonProgressModel.find({
            user: userId,
            lesson: { $in: lessonIds }
        }).populate({
            path: "lesson",
            select: "title order estimatedDuration"
        }).sort({ "lesson.order": 1 });
        
        const completedLessons = progressRecords.filter(p => p.status === 'completed');
        const completedCount = completedLessons.length;
        const percentage = Math.round((completedCount / totalLessons) * 100);
        
        // Update enrollment record with latest progress
        await enrollmentModel.findOneAndUpdate(
            { user: userId, course: courseId },
            { progress: percentage, lastAccessedAt: new Date() },
            { upsert: true }
        );
        
        res.json({
            success: true,
            message: "Course progress retrieved successfully",
            data: {
                totalLessons,
                completedCount,
                percentage,
                completedLessons: completedLessons.map(p => ({
                    lesson: p.lesson,
                    completedAt: p.completedAt,
                    timeSpent: p.timeSpent
                })),
                allProgress: progressRecords
            }
        });
    } catch (error) {
        console.error('Get user course progress error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching progress" 
        });
    }
};

// Get lesson progress for a specific lesson
export const getLessonProgress = async (req, res) => {
    try {
        const { userId, lessonId } = req.params;
        
        const progress = await lessonProgressModel.findOne({ 
            user: userId, 
            lesson: lessonId 
        }).populate("lesson", "title estimatedDuration");
        
        if (!progress) {
            return res.json({
                success: true,
                message: "No progress found",
                data: {
                    status: 'not-started',
                    progress: 0,
                    timeSpent: 0
                }
            });
        }
        
        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Get lesson progress error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching lesson progress" 
        });
    }
};

// Helper function to update overall course progress
const updateCourseProgress = async (userId, courseId) => {
    try {
        const totalLessons = await lessonModel.countDocuments({ 
            course: courseId, 
            isPublished: true 
        });
        const completedLessons = await lessonProgressModel.countDocuments({
            user: userId,
            status: "completed",
            lesson: { $in: await lessonModel.find({ course: courseId, isPublished: true }).distinct("_id") }
        });
        
        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        await enrollmentModel.findOneAndUpdate(
            { user: userId, course: courseId },
            { 
                progress: percentage,
                lastAccessedAt: new Date(),
                ...(percentage >= 100 && { status: 'completed', completedAt: new Date() })
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error updating course progress:', error);
    }