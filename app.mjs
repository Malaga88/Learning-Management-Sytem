import express from 'express';
import authRouter from './src/routes/authRoute.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('Welcome to the LMS App!');
});
app.use('/api/auth', authRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});