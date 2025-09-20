import userModel from "../models/userModel.mjs";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Name, email, and password are required" 
            });
        }
        
        // Check existing user first
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                message: "User already exists" 
            });
        }
        
        // Create user (password will be auto-hashed by pre-save hook)
        const newUser = new userModel({ 
            name: name.trim(), 
            email: email.toLowerCase().trim(), 
            password, 
            role 
        });
        
        await newUser.save();
        
        // Generate token
        const token = jsonwebtoken.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );
        
        res.status(201).json({ 
            success: true,
            message: "User registered successfully", 
            data: {
                user: newUser,
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle validation errors
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
            message: "Error registering user" 
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Email and password are required" 
            });
        }
        
        // Find user and include password for comparison
        const user = await userModel.findOne({ 
            email: email.toLowerCase().trim(),
            isActive: true 
        }).select('+password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }
        
        // Use the model's comparePassword method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
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

// Get user profile
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

// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const { name, bio, profilePicture } = req.body;
        const userId = req.user.id;
        
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { name, bio, profilePicture },
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