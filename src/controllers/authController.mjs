import userModel from "../models/userModel.mjs";
import jsonwebtoken from "jsonwebtoken";
import crypto from "crypto";
import emailService from "../services/emailService.mjs";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check existing user first
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                message: "User already exists" 
            });
        }
        
        // Create user
        const newUser = new userModel({ 
            name: name.trim(), 
            email: email.toLowerCase().trim(), 
            password, 
            role 
        });
        
        // Create email verification token
        const verificationToken = newUser.createEmailVerificationToken();
        await newUser.save();
        
        // Send verification email
        await emailService.sendVerificationEmail(newUser, verificationToken);
        
        res.status(201).json({ 
            success: true,
            message: "User registered successfully. Please check your email to verify your account.", 
            data: {
                user: newUser,
                needsEmailVerification: true
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error registering user" 
        });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required"
            });
        }
        
        // Hash the token to match stored token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        // Find user with valid token
        const user = await userModel.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            });
        }
        
        // Verify the email
        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();
        
        // Send welcome email
        await emailService.sendWelcomeEmail(user);
        
        // Generate login token
        const loginToken = jsonwebtoken.sign(
            { id: user._id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );
        
        res.json({
            success: true,
            message: "Email verified successfully",
            data: {
                user,
                token: loginToken
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: "Error verifying email"
        });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }
        
        // Create new verification token
        const verificationToken = user.createEmailVerificationToken();
        await user.save();
        
        // Send verification email
        await emailService.sendVerificationEmail(user, verificationToken);
        
        res.json({
            success: true,
            message: "Verification email sent successfully"
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: "Error sending verification email"
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent"
            });
        }
        
        // Create password reset token
        const resetToken = user.createPasswordResetToken();
        await user.save();
        
        // Send password reset email
        await emailService.sendPasswordResetEmail(user, resetToken);
        
        res.json({
            success: true,
            message: "If an account with that email exists, a password reset link has been sent"
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: "Error processing password reset request"
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }
        
        // Hash the token to match stored token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        // Find user with valid reset token
        const user = await userModel.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }
        
        // Update password and clear reset token
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();
        
        res.json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: "Error resetting password"
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }
        
        // Get user with password
        const user = await userModel.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // Verify current password
        const isValidPassword = await user.comparePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: "Error changing password"
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user and include password for comparison
        const user = await userModel.findOne({ 
            email: email.toLowerCase().trim(),
            isActive: true 
        }).select('+password');
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }
        
        // Check if email is verified
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email address before logging in",
                needsEmailVerification: true
            });
        }
        
        // Update last login
        await user.updateLastLogin();
        
        // Generate token
        const token = jsonwebtoken.sign(
            { id: user._id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );
        
        res.status(200).json({ 
            success: true,
            message: "Login successful", 
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error logging in" 
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        res.json({ 
            success: true,
            data: user 
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching profile" 
        });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { name, bio, profilePicture, preferences } = req.body;
        const userId = req.user.id;
        
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { 
                name, 
                bio, 
                profilePicture,
                ...(preferences && { preferences: { ...req.user.preferences, ...preferences } })
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        res.json({ 
            success: true,
            message: "Profile updated successfully",
            data: updatedUser 
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false,
            message: "Error updating profile" 
        });
    }
};
