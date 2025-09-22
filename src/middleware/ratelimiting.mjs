import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Quiz submission limiter
export const quizLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3, // limit each IP to 3 quiz submissions per minute
    message: {
        success: false,
        message: 'Too many quiz submissions, please wait before trying again'
    },
    standardHeaders: true,
    legacyHeaders: false
});