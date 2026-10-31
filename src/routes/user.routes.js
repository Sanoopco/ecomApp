import express from "express";

import {
    getAllUsers,
    getUserById,
    updateProfile,
    updateUserStatus,
} from "../controllers/user.controllers.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

import validate from "../middleware/validate.js";

import {
    updateProfileSchema,
    updateUserStatusSchema,
} from "../validators/user.validator.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer and Admin
router.patch(
    "/profile",
    validate(updateProfileSchema),
    updateProfile
);

// Admin only
router.get("/", adminOnly, getAllUsers);
router.get("/:id", adminOnly, getUserById);

router.patch(
    "/:id/status",
    adminOnly,
    validate(updateUserStatusSchema),
    updateUserStatus
);

export default router;