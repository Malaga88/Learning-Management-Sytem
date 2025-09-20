// src/controllers/lessonController.mjs
import lessonModel from "../models/lessonModel.mjs";
import courseModel from "../models/courseModel.mjs";
import lessonProgressModel from "../models/lessonProgressModel.mjs";

export const createLesson = async (req, res) => {
    try {
        const { 
            courseId, 
            title, 
            description, 
            content, 
            videoUrl, 
            videoDuration, 
            order, 
            resources, 
            estimatedDuration, 
            isFree 
        } = req.body;

        // Validate required fields
        if (!courseId || !title || !content) {
            return res.status(400).json({
                success: false,
                message: "Course ID, title, and content are required"
            });
        }

        // Ensure course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if order already exists
        if (order) {
            const existingLesson = await lessonModel.findOne({ course: courseId, order });
            if (existingLesson) {
                return res.status(400).json({
                    success: false,
                    message: "A lesson with this order already exists"
                });
            }
        }

        // If no order provided, set it to the next available order
        let lessonOrder = order;
        if (!lessonOrder) {
            const lastLesson = await lessonModel.findOne({ course: courseId })
                .sort({ order: -1 })
                .limit(1);
            lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
        }

        const lesson = new lessonModel({
            course: courseId,
            title: title.trim(),
            description: description?.trim(),
            content,
            videoUrl,
            videoDuration,
            order: lessonOrder,
            resources: resources?.map(r => ({
                name: r.name.trim(),
                url: r.url.trim(),
                type: r.type || 'other'
            })) || [],
            estimatedDuration,
            isFree: isFree || false
        });

        await lesson.save();

        res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            data: lesson
        });
    } catch (error) {
        console.error('Create lesson error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "A lesson with this order already exists in the course"
            });
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: "Error creating lesson"
        });
    }
};

// Get all lessons for a course
export const getCourseLessons = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { published, page = 1, limit = 20 } = req.query;

        // Validate course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const filter = { course: courseId };
        if (published !== undefined) {
            filter.isPublished = published === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const lessons = await lessonModel.find(filter)
            .populate("course", "title instructor")
            .sort({ order: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await lessonModel.countDocuments(filter);

        res.json({
            success: true,
            message: "Lessons retrieved successfully",
            data: lessons,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                hasNext: skip + parseInt(limit) < total,
                totalLessons: total
            }
        });
    } catch (error) {
        console.error('Get course lessons error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching lessons"
        });
    }
};

// Get a single lesson by ID
export const getLessonById = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { includeProgress } = req.query;

        const lesson = await lessonModel.findById(lessonId)
            .populate("course", "title description instructor price");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        let responseData = lesson.toObject();

        // Include user progress if requested and user is authenticated
        if (includeProgress && req.user) {
            const progress = await lessonProgressModel.findOne({
                user: req.user.id,
                lesson: lessonId
            });
            responseData.userProgress = progress;
        }

        res.json({
            success: true,
            message: "Lesson retrieved successfully",
            data: responseData
        });
    } catch (error) {
        console.error('Get lesson by ID error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching lesson"
        });
    }
};

// Update a lesson
export const updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const updates = req.body;

        // Remove course from updates (shouldn't be changed)
        delete updates.course;

        // Validate lesson exists
        const existingLesson = await lessonModel.findById(lessonId);
        if (!existingLesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        // Check if order conflict exists (if order is being updated)
        if (updates.order && updates.order !== existingLesson.order) {
            const orderConflict = await lessonModel.findOne({
                course: existingLesson.course,
                order: updates.order,
                _id: { $ne: lessonId }
            });

            if (orderConflict) {
                return res.status(400).json({
                    success: false,
                    message: "A lesson with this order already exists"
                });
            }
        }

        // Clean up resources if provided
        if (updates.resources) {
            updates.resources = updates.resources.map(r => ({
                name: r.name?.trim(),
                url: r.url?.trim(),
                type: r.type || 'other'
            }));
        }

        const lesson = await lessonModel.findByIdAndUpdate(
            lessonId,
            updates,
            { new: true, runValidators: true }
        ).populate("course", "title");

        res.json({
            success: true,
            message: "Lesson updated successfully",
            data: lesson
        });
    } catch (error) {
        console.error('Update lesson error:', error);

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: "Error updating lesson"
        });
    }
};

// Delete a lesson
export const deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await lessonModel.findByIdAndDelete(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        // Delete related lesson progress records
        await lessonProgressModel.deleteMany({ lesson: lessonId });

        // Reorder remaining lessons to fill the gap
        const remainingLessons = await lessonModel.find({ 
            course: lesson.course, 
            order: { $gt: lesson.order } 
        }).sort({ order: 1 });

        // Update orders to fill the gap
        for (let i = 0; i < remainingLessons.length; i++) {
            await lessonModel.findByIdAndUpdate(
                remainingLessons[i]._id,
                { order: lesson.order + i }
            );
        }

        res.json({
            success: true,
            message: "Lesson deleted successfully"
        });
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting lesson"
        });
    }
};

// Publish/Unpublish lesson
export const toggleLessonPublish = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { isPublished } = req.body;

        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "isPublished must be a boolean value"
            });
        }

        const lesson = await lessonModel.findByIdAndUpdate(
            lessonId,
            { isPublished },
            { new: true }
        ).populate("course", "title");

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        res.json({
            success: true,
            message: `Lesson ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: lesson
        });
    } catch (error) {
        console.error('Toggle lesson publish error:', error);
        res.status(500).json({
            success: false,
            message: "Error updating lesson"
        });
    }
};

// Reorder lessons within a course
export const reorderLessons = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { lessonOrders } = req.body; // Array of { lessonId, order }

        if (!Array.isArray(lessonOrders) || lessonOrders.length === 0) {
            return res.status(400).json({
                success: false,
                message: "lessonOrders must be a non-empty array"
            });
        }

        // Validate course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Validate all lessons belong to the course
        const lessonIds = lessonOrders.map(lo => lo.lessonId);
        const lessons = await lessonModel.find({
            _id: { $in: lessonIds },
            course: courseId
        });

        if (lessons.length !== lessonIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some lessons don't belong to this course"
            });
        }

        // Update lesson orders
        const updatePromises = lessonOrders.map(({ lessonId, order }) =>
            lessonModel.findByIdAndUpdate(lessonId, { order })
        );

        await Promise.all(updatePromises);

        // Get updated lessons
        const updatedLessons = await lessonModel.find({ course: courseId })
            .sort({ order: 1 })
            .select('title order isPublished');

        res.json({
            success: true,
            message: "Lessons reordered successfully",
            data: updatedLessons
        });
    } catch (error) {
        console.error('Reorder lessons error:', error);
        res.status(500).json({
            success: false,
            message: "Error reordering lessons"
        });
    }
};

// Duplicate a lesson
export const duplicateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const originalLesson = await lessonModel.findById(lessonId);
        if (!originalLesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        // Get next available order
        const lastLesson = await lessonModel.findOne({ course: originalLesson.course })
            .sort({ order: -1 })
            .limit(1);
        const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

        // Create duplicate
        const duplicatedLesson = new lessonModel({
            ...originalLesson.toObject(),
            _id: undefined,
            title: `${originalLesson.title} (Copy)`,
            order: nextOrder,
            isPublished: false, // Duplicates should be unpublished by default
            createdAt: undefined,
            updatedAt: undefined
        });

        await duplicatedLesson.save();

        res.status(201).json({
            success: true,
            message: "Lesson duplicated successfully",
            data: duplicatedLesson
        });
    } catch (error) {
        console.error('Duplicate lesson error:', error);
        res.status(500).json({
            success: false,
            message: "Error duplicating lesson"
        });
    }
};

// Get lesson statistics for a course
export const getLessonStats = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Validate course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const stats = await lessonModel.aggregate([
            { $match: { course: mongoose.Types.ObjectId(courseId) } },
            {
                $group: {
                    _id: null,
                    totalLessons: { $sum: 1 },
                    publishedLessons: {
                        $sum: { $cond: ['$isPublished', 1, 0] }
                    },
                    freeLessons: {
                        $sum: { $cond: ['$isFree', 1, 0] }
                    },
                    totalDuration: { $sum: '$estimatedDuration' },
                    avgDuration: { $avg: '$estimatedDuration' },
                    totalVideoDuration: { $sum: '$videoDuration' },
                    lessonsWithVideo: {
                        $sum: { $cond: [{ $ne: ['$videoUrl', null] }, 1, 0] }
                    },
                    totalResources: { $sum: { $size: { $ifNull: ['$resources', []] } } }
                }
            }
        ]);

        const result = stats[0] || {
            totalLessons: 0,
            publishedLessons: 0,
            freeLessons: 0,
            totalDuration: 0,
            avgDuration: 0,
            totalVideoDuration: 0,
            lessonsWithVideo: 0,
            totalResources: 0
        };

        res.json({
            success: true,
            message: "Lesson statistics retrieved successfully",
            data: result
        });
    } catch (error) {
        console.error('Get lesson stats error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching lesson statistics"
        });
    }
};

// Bulk update lessons
export const bulkUpdateLessons = async (req, res) => {
    try {
        const { lessonIds, updates } = req.body;

        if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "lessonIds must be a non-empty array"
            });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No updates provided"
            });
        }

        // Remove restricted fields
        delete updates.course;
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;

        const result = await lessonModel.updateMany(
            { _id: { $in: lessonIds } },
            updates,
            { runValidators: true }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} lessons updated successfully`,
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Bulk update lessons error:', error);
        res.status(500).json({
            success: false,
            message: "Error updating lessons"
        });
    }
};