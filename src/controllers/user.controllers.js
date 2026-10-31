
import User from "../models/User.js";
import mongoose from "mongoose";
// GET /api/v1/users
// Admin: Get all users
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-password");

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET /api/v1/users/:id
// Admin: Get a specific user
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// PATCH /api/v1/users/profile
// Customer/Admin: Update own profile
export const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (email) {
            const existingUser = await User.findOne({
                email,
                _id: { $ne: req.user._id }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered"
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { ...(name && { name }), ...(email && { email }) } },
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// PATCH /api/v1/users/:id/status
// Admin: Activate or deactivate a user
export const updateUserStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isActive ? "activated" : "deactivated"} successfully`,
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
