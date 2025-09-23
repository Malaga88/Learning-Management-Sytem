import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import authRouter from './src/routes/authRoute.mjs';
import courseRouter from './src/routes/courseRoute.mjs';
import lessonRouter from './src/routes/lessonRoute.mjs';
import quizRouter from './src/routes/quizRoute.mjs';
import questionRouter from './src/routes/questionRoute.mjs';
import enrollmentRouter from './src/routes/enrollmentRoute.mjs';
import gradeRouter from './src/routes/gradeRoute.mjs';
import lessonProgressRouter from './src/routes/lessonProgressRoute.mjs';
import uploadRouter from './src/routes/uploadRoute.mjs';
import notificationRouter from './src/routes/notificationRoute.mjs';
import analyticsRouter from './src/routes/analyticsRoute.mjs';
import utilityRouter from './src/routes/utilityRoute.mjs';

// Import middleware
import { generalLimiter } from './src/middleware/rateLimiting.mjs';
import { errorHandler } from './src/middleware/errorHandler.mjs';
import { requestLogger } from './src/middleware/logging.mjs';
import { analyticsMiddleware } from './src/middleware/analytics.mjs';
import connectToMongoDB from './src/lib/db.mjs';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Connect to MongoDB
connectToMongoDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP for file uploads
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
      ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Common middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(requestLogger);
app.use(generalLimiter);
app.use(analyticsMiddleware);

// Serve uploads if using local storage
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/questions', questionRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/grades', gradeRouter);
app.use('/api/progress', lessonProgressRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/utils', utilityRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
