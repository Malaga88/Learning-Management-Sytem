import express from "express";
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword
} from "../controllers/authController.mjs";
import { verifyToken } from "../middleware/auth.mjs";
import { validate, schemas } from "../middleware/validation.mjs";
import { authLimiter } from "../middleware/rateLimiting.mjs";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", 
    authLimiter,
    validate(schemas.register),
    registerUser
);

authRouter.post("/login", 
    authLimiter,
    validate(schemas.login),
    loginUser
);

authRouter.post("/verify-email",
    authLimiter,
    verifyEmail
);

authRouter.post("/resend-verification",
    authLimiter,
    resendVerification
);

authRouter.post("/forgot-password",
    authLimiter,
    forgotPassword
);

authRouter.post("/reset-password",
    authLimiter,
    resetPassword
);

// Protected routes
authRouter.get("/profile", 
    verifyToken, 
    getUserProfile
);

authRouter.put("/profile", 
    verifyToken,
    validate(schemas.updateProfile),
    updateUserProfile
);

authRouter.post("/change-password",
    verifyToken,
    changePassword
);

export default authRouter;