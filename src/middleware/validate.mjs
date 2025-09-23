import Joi from 'joi';

// Generic validation middleware
export const validate = (schema) => {

    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });
        
        if (error) {
            const validationErrors = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }
        
        req.body = value; // Use validated and sanitized data
        next();
    };
};

// Validation schemas
export const schemas = {
    // Auth schemas
    register: Joi.object({
        name: Joi.string().trim().min(2).max(50).required(),
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().min(6).max(128).required(),
        role: Joi.string().valid('student', 'instructor', 'admin').default('student')
    }),
    
    login: Joi.object({
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().required()
    }),
    
    updateProfile: Joi.object({
        name: Joi.string().trim().min(2).max(50),
        bio: Joi.string().trim().max(500).allow(''),
        profilePicture: Joi.string().uri().allow('')
    }),
    
    // Course schemas
    createCourse: Joi.object({
        title: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().max(1000).required(),
        category: Joi.string().trim().max(50).allow(''),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
        tags: Joi.array().items(Joi.string().trim().max(30)).max(10),
        price: Joi.number().min(0).default(0),
        duration: Joi.number().min(0),
        maxStudents: Joi.number().min(1).default(1000),
        requirements: Joi.array().items(Joi.string().trim().max(200)).max(20),
        learningOutcomes: Joi.array().items(Joi.string().trim().max(200)).max(20),
        thumbnailUrl: Joi.string().uri().allow(''),
        instructorEmail: Joi.string().email()
    }),
    
    updateCourse: Joi.object({
        title: Joi.string().trim().min(3).max(100),
        description: Joi.string().trim().max(1000),
        category: Joi.string().trim().max(50).allow(''),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
        tags: Joi.array().items(Joi.string().trim().max(30)).max(10),
        price: Joi.number().min(0),
        duration: Joi.number().min(0),
        maxStudents: Joi.number().min(1),
        requirements: Joi.array().items(Joi.string().trim().max(200)).max(20),
        learningOutcomes: Joi.array().items(Joi.string().trim().max(200)).max(20),
        thumbnailUrl: Joi.string().uri().allow(''),
        isPublished: Joi.boolean()
    }),
    
    // Lesson schemas
    createLesson: Joi.object({
        courseId: Joi.string().hex().length(24).required(),
        title: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().max(500).allow(''),
        content: Joi.string().required(),
        videoUrl: Joi.string().uri().allow(''),
        videoDuration: Joi.number().min(0),
        order: Joi.number().min(1),
        resources: Joi.array().items(Joi.object({
            name: Joi.string().trim().max(100).required(),
            url: Joi.string().uri().required(),
            type: Joi.string().valid('pdf', 'video', 'link', 'document', 'other').default('other')
        })).max(20),
        estimatedDuration: Joi.number().min(1),
        isFree: Joi.boolean().default(false)
    }),
    
    updateLesson: Joi.object({
        title: Joi.string().trim().min(3).max(100),
        description: Joi.string().trim().max(500).allow(''),
        content: Joi.string(),
        videoUrl: Joi.string().uri().allow(''),
        videoDuration: Joi.number().min(0),
        order: Joi.number().min(1),
        resources: Joi.array().items(Joi.object({
            name: Joi.string().trim().max(100).required(),
            url: Joi.string().uri().required(),
            type: Joi.string().valid('pdf', 'video', 'link', 'document', 'other').default('other')
        })).max(20),
        estimatedDuration: Joi.number().min(1),
        isFree: Joi.boolean(),
        isPublished: Joi.boolean()
    }),
    
    reorderLessons: Joi.object({
        lessonOrders: Joi.array().items(Joi.object({
            lessonId: Joi.string().hex().length(24).required(),
            order: Joi.number().min(1).required()
        })).min(1).required()
    }),
    
    // Quiz schemas
    createQuiz: Joi.object({
        courseId: Joi.string().hex().length(24).required(),
        title: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().max(500).allow(''),
        timeLimit: Joi.number().min(1).max(480),
        passingScore: Joi.number().min(0).max(100).default(60),
        maxAttempts: Joi.number().min(1).default(3),
        shuffleQuestions: Joi.boolean().default(false),
        showCorrectAnswers: Joi.boolean().default(true),
        allowReview: Joi.boolean().default(true),
        order: Joi.number().min(1),
        questions: Joi.array().items(Joi.object({
            text: Joi.string().trim().min(5).max(1000).required(),
            type: Joi.string().valid('multiple-choice', 'true-false', 'fill-in-blank').default('multiple-choice'),
            options: Joi.array().items(Joi.object({
                text: Joi.string().trim().max(200).required(),
                isCorrect: Joi.boolean().default(false)
            })).min(2).max(6),
            correctAnswer: Joi.number().min(0),
            points: Joi.number().min(1).default(1),
            explanation: Joi.string().trim().max(500).allow(''),
            difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
            order: Joi.number().min(1)
        }))
    }),
    
    // Question schemas
    createQuestion: Joi.object({
        text: Joi.string().trim().min(5).max(1000).required(),
        type: Joi.string().valid('multiple-choice', 'true-false', 'fill-in-blank').default('multiple-choice'),
        options: Joi.array().items(Joi.object({
            text: Joi.string().trim().max(200).required(),
            isCorrect: Joi.boolean().default(false)
        })).min(2).max(6),
        correctAnswer: Joi.number().min(0),
        points: Joi.number().min(1).default(1),
        explanation: Joi.string().trim().max(500).allow(''),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
        order: Joi.number().min(1)
    }),
    
    // Enrollment schemas
    enrollInCourse: Joi.object({
        userId: Joi.string().hex().length(24).required(),
        courseId: Joi.string().hex().length(24).required(),
        paymentAmount: Joi.number().min(0).default(0)
    }),
    
    // Progress schemas
    updateLessonProgress: Joi.object({
        userId: Joi.string().hex().length(24).required(),
        lessonId: Joi.string().hex().length(24).required(),
        progress: Joi.number().min(0).max(100).default(100),
        timeSpent: Joi.number().min(0).default(0),
        notes: Joi.string().max(2000).allow(''),
        bookmarks: Joi.array().items(Joi.object({
            timestamp: Joi.number().min(0).required(),
            note: Joi.string().max(200).allow('')
        })).max(50)
    }),
    
    // Quiz attempt schema
    submitQuizAttempt: Joi.object({
        answers: Joi.array().items(Joi.object({
            questionId: Joi.string().hex().length(24).required(),
            selectedAnswer: Joi.alternatives().try(
                Joi.number(),
                Joi.string(),
                Joi.boolean()
            ).required(),
            timeSpent: Joi.number().min(0).default(0)
        })).required(),
        timeSpent: Joi.number().min(0).default(0),
        userAgent: Joi.string().max(500).allow('')
    })
};


const additionalSchemas = {
    verifyEmail: Joi.object({
        token: Joi.string().required()
    }),
    
    resendVerification: Joi.object({
        email: Joi.string().email().lowercase().trim().required()
    }),
    
    forgotPassword: Joi.object({
        email: Joi.string().email().lowercase().trim().required()
    }),
    
    resetPassword: Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string().min(6).max(128).required()
    }),
    
    changePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).max(128).required()
    }),
    
    updateProfile: Joi.object({
        name: Joi.string().trim().min(2).max(50),
        bio: Joi.string().trim().max(500).allow(''),
        profilePicture: Joi.string().uri().allow(''),
        preferences: Joi.object({
            language: Joi.string().valid('en', 'es', 'fr', 'de', 'it'),
            timezone: Joi.string(),
            notifications: Joi.object({
                email: Joi.boolean(),
                courseUpdates: Joi.boolean(),
                marketing: Joi.boolean()
            })
        })
    })
};