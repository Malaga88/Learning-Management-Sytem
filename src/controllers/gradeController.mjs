import gradeModel from "../models/gradeModel.mjs";
import userModel from "../models/userModel.mjs";
import quizModel from "../models/quizModel.mjs";
import enrollmentModel from "../models/enrollmentModel.mjs";

// This function is now replaced by submitQuizAttempt in quizController
// Kept for backward compatibility but marked as deprecated
export const submitGrade = async (req, res) => {
    return res.status(400).json({
        success: false,
        message: "This endpoint is deprecated. Please use POST /api/quizzes/:id/submit instead"
    });
};

export const getGrades = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const grades = await gradeModel.find({ user: userId })
            .populate({
                path: "quiz",
                populate: {
                    path: "course",
                    select: "title"
                }
            })
            .populate("user", "name email")
            .sort({ lastAttemptAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await gradeModel.countDocuments({ user: userId });
        
        res.json({
            success: true,
            message: "Grades retrieved successfully",
            data: grades,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                hasNext: skip + parseInt(limit) < total
            }
        });
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching grades" 
        });
    }
};

export const getQuizGrade = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        const grades = await gradeModel.find({ quiz: quizId })
            .populate("user", "name email profilePicture")
            .populate("quiz", "title passingScore")
            .sort({ bestPercentage: -1 })
            .lean();
        
        res.json({
            success: true,
            message: "Quiz grades retrieved successfully",
            data: grades
        });
    } catch (error) {
        console.error('Get quiz grades error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
};

export const getUserQuizGrade = async (req, res) => {
    try {
        const { userId, quizId } = req.params;
        
        const grade = await gradeModel.findOne({ user: userId, quiz: quizId })
            .populate("user", "name email")
            .populate({
                path: "quiz",
                populate: {
                    path: "course",
                    select: "title"
                }
            });
        
        if (!grade) {
            return res.status(404).json({ 
                success: false,
                message: "No grade found for this quiz" 
            });
        }
        
        res.json({
            success: true,
            data: grade
        });
    } catch (error) {
        console.error('Get user quiz grade error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error" 
        });
    }
  };