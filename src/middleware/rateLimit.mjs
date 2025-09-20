import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, try again later." },
});

export const quizLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Too many quiz submissions, slow down." },
});
