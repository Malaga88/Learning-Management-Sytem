import express from 'express';
import authRouter from './src/routes/authRoute.mjs';
import questionRouter from './src/routes/questionRoute.mjs';
import lessonRouter from './src/routes/lessonRoute.mjs';
import quizRouter from './src/routes/quizroute.mjs';
import enrollmentRouter from './src/routes/enrollmentRoute.mjs';
import gradeRouter from './src/routes/gradeRoute.mjs';
import lessonProgressRouter from './src/routes/lessonProgressRoute.mjs';
import courseRouter from './src/routes/courseRoute.mjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectToMongoDB from './src/lib/db.mjs';

dotenv.config();

connectToMongoDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('Welcome to the LMS App!');
});
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/questions', questionRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/grades', gradeRouter);
app.use('/api/lesson-progress', lessonProgressRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});