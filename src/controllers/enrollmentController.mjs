import enrollmentModel from "../models/enrollmentModel.mjs";
import userModel from "../models/userModel.mjs";
import courseModel from "../models/courseModel.mjs";

export const enrollInCourse = async (req, res) => {
    try {
        const { userId, courseId, paymentAmount = 0 } = req.body;
        
        // Validate user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        // Validate course exists and is published
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: "Course not found" 
            });
        }
        
        if (!course.isPublished) {
            return res.status(400).json({ 
                success: false,
                message: "Cannot enroll in unpublished course" 
            });
        }
        
        // Check enrollment capacity
        if (course.currentEnrollments >= course.maxStudents) {
            return res.status(400).json({ 
                success: false,
                message: "Course has reached maximum enrollment capacity" 
            });
        }
        
        // Check if already enrolled
        const existingEnrollment = await enrollmentModel.findOne({ 
            user: userId, 
            course: courseId 
        });
        
        if (existingEnrollment) {
            if (existingEnrollment.status === 'dropped') {
                // Re-activate dropped enrollment
                existingEnrollment.status = 'active';
                existingEnrollment.enrolledAt = new Date();
                await existingEnrollment.save();
                
                return res.status(200).json({
                    success: true,
                    message: "Re-enrolled in course successfully",
                    data: existingEnrollment
                });
            } else {
                return res.status(409).json({ 
                    success: false,
                    message: "User already enrolled in this course" 
                });
            }
        }
        
        // Create new enrollment
        const newEnrollment = new enrollmentModel({
            user: userId,
            course: courseId,
            paymentAmount,
            paymentStatus: paymentAmount > 0 ? 'pending' : 'free'
        });
        
        await newEnrollment.save();
        
        // Update course enrollment count
        await courseModel.findByIdAndUpdate(
            courseId,
            { $inc: { currentEnrollments: 1 } }
        );
        
        // Populate enrollment data
        await newEnrollment.populate([
            { path: 'user', select: 'name email' },
            { path: 'course', select: 'title description price' }
        ]);
        
        res.status(201).json({
            success: true,
            message: "Enrolled in course successfully",
            data: newEnrollment
        });
        
    } catch (error) {
        console.error('Enroll in course error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error enrolling in course" 
        });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { progress } = req.body;
        
        if (progress < 0 || progress > 100) {
            return res.status(400).json({ 
                success: false,
                message: "Progress must be between 0 and 100" 
            });
        }
        
        const enrollment = await enrollmentModel.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ 
                success: false,
                message: "Enrollment not found" 
            });
        }
        
        enrollment.progress = progress;
        await enrollment.save();
        
        res.json({ 
            success: true,
            message: "Progress updated successfully", 
            data: enrollment 
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};

export const getUserEnrollments = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        
        const filter = { user: userId };
        if (status) filter.status = status;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const enrollments = await enrollmentModel.find(filter)
            .populate({
                path: "course",
                select: "title description thumbnailUrl price level category rating",
                populate: {
                    path: "instructor",
                    select: "name profilePicture"
                }
            })
            .populate("user", "name email")
            .sort({ enrolledAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await enrollmentModel.countDocuments(filter);
        
        res.json({
            success: true,
            message: "Enrollments retrieved successfully",
            data: enrollments,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                hasNext: skip + parseInt(limit) < total
            }
        });
    } catch (error) {
        console.error('Get user enrollments error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};

export const dropCourse = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        
        const enrollment = await enrollmentModel.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ 
                success: false,
                message: "Enrollment not found" 
            });
        }
        
        if (enrollment.status === 'completed') {
            return res.status(400).json({ 
                success: false,
                message: "Cannot drop a completed course" 
            });
        }
        
        enrollment.status = "dropped";
        await enrollment.save();
        
        // Decrease course enrollment count
        await courseModel.findByIdAndUpdate(
            enrollment.course,
            { $inc: { currentEnrollments: -1 } }
        );
        
        res.json({ 
            success: true,
            message: "Course dropped successfully", 
            data: enrollment 
        });
    } catch (error) {
        console.error('Drop course error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};

export const getCourseEnrollments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        
        const filter = { course: courseId };
        if (status) filter.status = status;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const enrollments = await enrollmentModel.find(filter)
            .populate("user", "name email profilePicture")
            .populate("course", "title")
            .sort({ enrolledAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await enrollmentModel.countDocuments(filter);
        
        res.json({
            success: true,
            message: "Course enrollments retrieved successfully",
            data: enrollments,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                hasNext: skip + parseInt(limit) < total
            }
        });
    } catch (error) {
        console.error('Get course enrollments error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};