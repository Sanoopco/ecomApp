import express from "express";

import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controllers.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

import validate from "../middleware/validate.js";

import {
    createProductSchema,
    updateProductSchema,
} from "../validators/product.validator.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin-only routes
router.post(
    "/",
    protect,
    adminOnly,
    validate(createProductSchema),
    createProduct
);

router.put(
    "/:id",
    protect,
    adminOnly,
    validate(updateProductSchema),
    updateProduct
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteProduct
);

export default router;