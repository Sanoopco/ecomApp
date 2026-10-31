import express from "express";

import {
    createCategory,
    getAllCategories,
    getCategoryTree,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controllers.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

import validate from "../middleware/validate.js";

import {
    createCategorySchema,
    updateCategorySchema,
} from "../validators/category.validator.js";

const router = express.Router();

// Public routes
router.get("/", getAllCategories);
router.get("/tree", getCategoryTree);
router.get("/:id", getCategoryById);

// Admin-only routes
router.post(
    "/",
    protect,
    adminOnly,
    validate(createCategorySchema),
    createCategory
);

router.put(
    "/:id",
    protect,
    adminOnly,
    validate(updateCategorySchema),
    updateCategory
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteCategory
);

export default router;