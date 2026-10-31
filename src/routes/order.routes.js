import express from "express";

import {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
} from "../controllers/order.controllers.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

import validate from "../middleware/validate.js";

import {
    createOrderSchema,
    updateOrderStatusSchema,
} from "../validators/order.validator.js";

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Customer routes
router.post(
    "/",
    validate(createOrderSchema),
    createOrder
);

router.get("/my-orders", getMyOrders);

// Admin routes
router.get("/", adminOnly, getAllOrders);

router.patch(
    "/:id/status",
    adminOnly,
    validate(updateOrderStatusSchema),
    updateOrderStatus
);

// Customer can view their own order; admin can view any order
router.get("/:id", getOrderById);

export default router;