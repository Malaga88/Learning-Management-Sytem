import quizModel from "../models/quizModel.mjs";
import questionModel from "../models/questionModel.mjs";
import gradeModel from "../models/gradeModel.mjs";
import enrollmentModel from "../models/enrollmentModel.mjs";
import courseModel from "../models/courseModel.mjs";

export const createQuiz = async (req, res) => {
    try {
        const { 
            courseId, 
            title, 
            description, 
            timeLimit, 
            passingScore,
            maxAttempts,
            shuffleQuestions,
            showCorrectAnswers,
            allowReview,
            order,
            questions 
        } = req.body;
        
        // Verify course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: "Course not found" 
            });
        }
        
        // Create quiz
        const newQuiz = new quizModel({ 
            course: courseId, 
            title: title.trim(), 
            description: description?.trim(), 
            timeLimit,
            passingScore: passingScore || 60,
            maxAttempts: maxAttempts || 3,
            shuffleQuestions: shuffleQuestions || false,
            showCorrectAnswers: showCorrectAnswers !== false,
            allowReview: allowReview !== false,
            order
        });
        
        await newQuiz.save();
        
        // If questions are provided, create and link them
        if (questions && questions.length > 0) {
            const createdQuestions = await questionModel.insertMany(
                questions.map((q, index) => ({ 
                    ...q, 
                    quiz: newQuiz._id,
                    order: q.order || index + 1
                }))
            );
            newQuiz.questions = createdQuestions.map(q => q._id);
            await newQuiz.save();
        }
        
        res.status(201).json({ 
            success: true,
            message: "Quiz created successfully", 
            data: newQuiz 
        });
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error creating quiz" 
        });
    }
};

export const getQuizzes = async (req, res) => {
    try {
        const { courseId, published } = req.query;
        
        const filter = {};
        if (courseId) filter.course = courseId;
        if (published !== undefined) filter.isPublished = published === 'true';
        
        const quizzes = await quizModel.find(filter)
            .populate("course", "title")
            .populate('questionCount')
            .sort({ order: 1, createdAt: 1 })
            .lean();
        
        res.status(200).json({
            success: true,
            message: "Quizzes retrieved successfully",
            data: quizzes
        });
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving quizzes" 
        });
    }
};

export const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeAnswers = false } = req.query;
        
        let quiz = await quizModel.findById(id)
            .populate("course", "title description")
            .populate({
                path: "questions",
                select: includeAnswers === 'true' ? '' : '-correctAnswer -options.isCorrect',
                options: { sort: { order: 1 } }
            });
        
        if (!quiz) {
            return res.status(404).json({ 
                success: false,
                message: "Quiz not found" 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: "Quiz retrieved successfully", 
            data: quiz 
        });
    } catch (error) {
        console.error('Get quiz by ID error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving quiz" 
        });
    }
};

export const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remove course from updates
        delete updates.course;
        
        const updatedQuiz = await quizModel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate("course", "title");
        
        if (!updatedQuiz) {
            return res.status(404).json({ 
                success: false,
                message: "Quiz not found" 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: "Quiz updated successfully", 
            data: updatedQuiz 
        });
    } catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error updating quiz" 
        });
    }
};

export const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedQuiz = await quizModel.findByIdAndDelete(id);
        if (!deletedQuiz) {
            return res.status(404).json({ 
                success: false,
                message: "Quiz not found" 
            });
        }
        
        // Delete related questions and grades
        await questionModel.deleteMany({ quiz: id });
        await gradeModel.deleteMany({ quiz: id });
        
        res.status(200).json({ 
            success: true,
            message: "Quiz and related data deleted successfully" 
        });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error deleting quiz" 
        });
    }
};

// Submit quiz attempt
export const submitQuizAttempt = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const { answers, timeSpent, userAgent } = req.body;
        const userId = req.user.id;
        const ipAddress = req.ip;
        
        // Get quiz with questions
        const quiz = await quizModel.findById(quizId).populate("questions course");
        if (!quiz) {
            return res.status(404).json({ 
                success: false,
                message: "Quiz not found" 
            });
        }
        
        // Check if user is enrolled in the course
        const enrollment = await enrollmentModel.findOne({ 
            user: userId, 
            course: quiz.course._id,
            status: 'active'
        });
        if (!enrollment) {
            return res.status(403).json({ 
                success: false,
                message: "You must be enrolled in this course to take the quiz" 
            });
        }
        
        // Get or create grade record
        let grade = await gradeModel.findOne({ user: userId, quiz: quizId });
        
        // Check attempt limits
        if (grade && grade.attempts.length >= quiz.maxAttempts) {
            return res.status(400).json({ 
                success: false,
                message: `Maximum attempts (${quiz.maxAttempts}) reached for this quiz` 
            });
        }
        
        // Calculate score
        let score = 0;
        const maxScore = quiz.questions.length;
        const attemptAnswers = [];
        
        for (const question of quiz.questions) {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = userAnswer && 
                (question.correctAnswer === userAnswer.selectedAnswer ||
                 question.options[question.correctAnswer]?.isCorrect === true);
            
            if (isCorrect) score++;
            
            attemptAnswers.push({
                questionId: question._id,
                selectedAnswer: userAnswer?.selectedAnswer,
                isCorrect,
                points: isCorrect ? question.points || 1 : 0,
                timeSpent: userAnswer?.timeSpent || 0
            });
        }
        
        const percentage = Math.round((score / maxScore) * 100);
        const status = percentage >= quiz.passingScore ? 'passed' : 'failed';
        
        // Create attempt
        const attempt = {
            score,
            maxScore,
            percentage,
            answers: attemptAnswers,
            timeSpent,
            ipAddress,
            userAgent
        };
        
        if (!grade) {
            // Create new grade record
            grade = new gradeModel({
                user: userId,
                quiz: quizId,
                attempts: [attempt],
                bestScore: score,
                bestPercentage: percentage,
                totalAttempts: 1,
                status,
                firstAttemptAt: new Date(),
                lastAttemptAt: new Date()
            });
        } else {
            // Add attempt to existing grade
            grade.attempts.push(attempt);
            grade.totalAttempts = grade.attempts.length;
            grade.lastAttemptAt = new Date();
            
            // Update best scores
            if (percentage > grade.bestPercentage) {
                grade.bestScore = score;
                grade.bestPercentage = percentage;
                grade.status = status;
            }
        }
        
        await grade.save();
        
        // Update course progress if quiz passed
        if (status === 'passed') {
            await updateCourseProgressAfterQuiz(userId, quiz.course._id);
        }
        
        res.status(200).json({
            success: true,
            message: "Quiz submitted successfully",
            data: {
                score,
                maxScore,
                percentage,
                status,
                attempt: grade.totalAttempts,
                bestPercentage: grade.bestPercentage,
                passed: status === 'passed',
                showAnswers: quiz.showCorrectAnswers,
                results: quiz.showCorrectAnswers ? attemptAnswers : undefined
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error submitting quiz" 
        });
    }
};

// Helper function to update course progress after quiz completion
const updateCourseProgressAfterQuiz = async (userId, courseId) => {
    try {
        const totalQuizzes = await quizModel.countDocuments({ course: courseId });
        const passedQuizzes = await gradeModel.countDocuments({ 
            user: userId, 
            quiz: { $in: await quizModel.find({ course: courseId }).distinct("_id") },
            status: 'passed'
        });
        
        const quizProgress = Math.round((passedQuizzes / totalQuizzes) * 100);
        
        // Update enrollment progress (this is a simplified version)
        await enrollmentModel.findOneAndUpdate(
            { user: userId, course: courseId },
            { progress: Math.max(quizProgress, 0) },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error updating course progress:', error);
    }
};