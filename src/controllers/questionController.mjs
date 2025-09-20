import questionModel from "../models/questionModel.mjs";
import quizModel from "../models/quizModel.mjs";

// Add question to quiz
export const addQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { 
            text, 
            type = 'multiple-choice', 
            options, 
            correctAnswer, 
            points = 1, 
            explanation, 
            difficulty = 'medium',
            order 
        } = req.body;
        
        // Validate quiz exists
        const quiz = await quizModel.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ 
                success: false,
                message: "Quiz not found" 
            });
        }
        
        // Prepare question data
        const questionData = {
            quiz: quizId,
            text: text.trim(),
            type,
            points,
            explanation: explanation?.trim(),
            difficulty,
            order
        };
        
        // Handle different question types
        if (type === 'multiple-choice') {
            if (!options || options.length < 2) {
                return res.status(400).json({ 
                    success: false,
                    message: "Multiple choice questions must have at least 2 options" 
                });
            }
            
            questionData.options = options.map((option, index) => ({
                text: option.text.trim(),
                isCorrect: index === correctAnswer
            }));
            questionData.correctAnswer = correctAnswer;
        } else if (type === 'true-false') {
            questionData.options = [
                { text: 'True', isCorrect: correctAnswer === 0 },
                { text: 'False', isCorrect: correctAnswer === 1 }
            ];
            questionData.correctAnswer = correctAnswer;
        }
        
        const question = new questionModel(questionData);
        await question.save();
        
        // Add question to quiz
        await quizModel.findByIdAndUpdate(quizId, { 
            $push: { questions: question._id } 
        });
        
        res.status(201).json({ 
            success: true,
            message: "Question added successfully", 
            data: question 
        });
    } catch (error) {
        console.error('Add question error:', error);
        
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
            message: "Error adding question" 
        });
    }
};

// Get questions for a quiz
export const getQuizQuestions = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { includeAnswers = false } = req.query;
        
        const selectFields = includeAnswers === 'true' ? '' : '-correctAnswer -options.isCorrect';
        
        const questions = await questionModel.find({ quiz: quizId })
            .select(selectFields)
            .sort({ order: 1, createdAt: 1 })
            .lean();
        
        res.json({
            success: true,
            message: "Questions retrieved successfully",
            data: questions
        });
    } catch (error) {
        console.error('Get quiz questions error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching questions" 
        });
    }
};

// Update a question
export const updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const updates = req.body;
        
        // Remove quiz from updates
        delete updates.quiz;
        
        const question = await questionModel.findByIdAndUpdate(
            questionId,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!question) {
            return res.status(404).json({ 
                success: false,
                message: "Question not found" 
            });
        }
        
        res.json({ 
            success: true,
            message: "Question updated successfully", 
            data: question 
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error updating question" 
        });
    }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        
        const question = await questionModel.findByIdAndDelete(questionId);
        if (!question) {
            return res.status(404).json({ 
                success: false,
                message: "Question not found" 
            });
        }
        
        // Remove question from quiz
        await quizModel.findByIdAndUpdate(question.quiz, {
            $pull: { questions: questionId }
        });
        
        res.json({ 
            success: true,
            message: "Question deleted successfully" 
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error deleting question" 
        });
    }
};

// Check single answer (for practice mode)
export const checkAnswer = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { selectedOption } = req.body;
        
        const question = await questionModel.findById(questionId);
        if (!question) {
            return res.status(404).json({ 
                success: false,
                message: "Question not found" 
            });
        }
        
        const isCorrect = question.correctAnswer === selectedOption;
        
        res.status(200).json({ 
            success: true,
            message: "Answer checked successfully", 
            data: {
                isCorrect,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation
            }
        });
    } catch (error) {
        console.error('Check answer error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error checking answer" 
        });
    }
}; course" 
        });
    }
};

export const getCourses = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            level, 
            instructor, 
            search,
            published 
        } = req.query;
        
        // Build filter
        const filter = {};
        if (category) filter.category = new RegExp(category, 'i');
        if (level) filter.level = level;
        if (instructor) filter.instructor = instructor;
        if (published !== undefined) filter.isPublished = published === 'true';
        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') }
            ];
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const courses = await courseModel.find(filter)
            .populate('instructor', 'name email profilePicture')
            .populate('lessonCount')
            .populate('quizCount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await courseModel.countDocuments(filter);
        
        res.status(200).json({ 
            success: true,
            message: "Courses retrieved successfully", 
            data: courses,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                hasNext: skip + parseInt(limit) < total,
                totalCourses: total
            }
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving courses" 
        });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const course = await courseModel.findById(id)
            .populate('instructor', 'name email profilePicture bio')
            .populate('lessonCount')
            .populate('quizCount');
        
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: "Course not found" 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: "Course retrieved successfully", 
            data: course 
        });
    } catch (error) {
        console.error('Get course by ID error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving course" 
        });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remove instructor from updates if present
        delete updates.instructor;
        
        const updatedCourse = await courseModel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('instructor', 'name email profilePicture');
        
        if (!updatedCourse) {
            return res.status(404).json({ 
                success: false,
                message: "Course not found" 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: "Course updated successfully", 
            data: updatedCourse 
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error updating course" 
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedCourse = await courseModel.findByIdAndDelete(id);
        if (!deletedCourse) {
            return res.status(404).json({ 
                success: false,
                message: "Course not found" 
            });
        }
        
        // TODO: Add cascade delete for lessons, quizzes, enrollments, etc.
        
        res.status(200).json({ 
            success: true,
            message: "Course deleted successfully" 
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error deleting course" 
        });
    }
};

export const publishCourse = async (req, res) => {
    try {
        const { id } = req.params;
        
        const course = await courseModel.findByIdAndUpdate(
            id,
            { isPublished: true },
            { new: true }
        ).populate('instructor', 'name email');
        
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: "Course not found" 
            });
        }
        
        res.json({ 
            success: true,
            message: "Course published successfully",
            data: course 
        });
    } catch (error) {
        console.error('Publish course error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error publishing course" 
        });
    }
};