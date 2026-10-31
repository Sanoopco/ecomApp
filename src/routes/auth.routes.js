import express from "express";

import {
    register,
    login,
    getProfile,
} from "../controllers/auth.controllers.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";

import {
    registerSchema,
    loginSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protected route
router.get("/profile", protect, getProfile);

export default router;