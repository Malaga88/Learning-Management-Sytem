import express from 'express';
import authRouter from './src/routes/authRoute.mjs';
import courseRouter from './src/routes/courseRoute.mjs';
import quizRouter from './src/routes/quizroute.mjs';
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});