import courseModel from "../models/courseModel.mjs";
import userModel from "../models/userModel.mjs";

export const createCourse = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            category, 
            level, 
            tags, 
            price, 
            duration, 
            maxStudents, 
            requirements, 
            learningOutcomes, 
            thumbnailUrl 
        } = req.body;
        
        // Use authenticated user as instructor or find by email
        let instructorId;
        if (req.body.instructorEmail) {
            const instructor = await userModel.findOne({ 
                email: req.body.instructorEmail, 
                role: "instructor",
                isActive: true 
            });
            if (!instructor) {
                return res.status(404).json({ 
                    success: false,
                    message: "Instructor not found" 
                });
            }
            instructorId = instructor._id;
        } else {
            // Use authenticated user
            if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false,
                    message: "Only instructors can create courses" 
                });
            }
            instructorId = req.user.id;
        }
        
        // Check if course already exists for this instructor
        const existingCourse = await courseModel.findOne({ 
            title: title.trim(), 
            instructor: instructorId 
        });
        if (existingCourse) {
            return res.status(400).json({ 
                success: false,
                message: "Course with this title already exists for this instructor" 
            });
        }
        
        // Create the course
        const newCourse = new courseModel({
            title: title.trim(),
            description: description.trim(),
            instructor: instructorId,
            category: category?.trim(),
            level,
            tags: tags?.map(tag => tag.trim()),
            price: price || 0,
            duration,
            maxStudents,
            requirements: requirements?.map(req => req.trim()),
            learningOutcomes: learningOutcomes?.map(outcome => outcome.trim()),
            thumbnailUrl
        });
        
        await newCourse.save();
        
        // Populate instructor info
        await newCourse.populate('instructor', 'name email profilePicture');
        
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        });
        
    } catch (error) {
        console.error('Create course error:', error);
        
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
        const { published } = req.query;
        
        const filter = { course: courseId };
        if (published !== undefined) {
            filter.isPublished = published === 'true';
        }
        
        const lessons = await lessonModel.find(filter)
            .populate("course", "title")
            .sort({ order: 1 })
            .lean();
        
        res.json({
            success: true,
            message: "Lessons retrieved successfully",
            data: lessons
        });
    } catch (error) {
        console.error('Get course lessons error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching lessons" 
        });
    }
};

// Get a single lesson
export const getLessonById = async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        const lesson = await lessonModel.findById(lessonId)
            .populate("course", "title description instructor");
        
        if (!lesson) {
            return res.status(404).json({ 
                success: false,
                message: "Lesson not found" 
            });
        }
        
        res.json({
            success: true,
            message: "Lesson retrieved successfully",
            data: lesson
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
        
        // Remove course from updates
        delete updates.course;
        
        const lesson = await lessonModel.findByIdAndUpdate(
            lessonId, 
            updates, 
            { new: true, runValidators: true }
        ).populate("course", "title");
        
        if (!lesson) {
            return res.status(404).json({ 
                success: false,
                message: "Lesson not found" 
            });
        }
        
        res.json({ 
            success: true,
            message: "Lesson updated successfully", 
            data: lesson 
        });
    } catch (error) {
        console.error('Update lesson error:', error);
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
        
        // TODO: Delete related lesson progress records
        
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