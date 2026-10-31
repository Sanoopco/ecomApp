import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// POST /api/v1/orders
// Customer: Create an order
export const createOrder = async (req, res, next) => {


    const session = await mongoose.startSession();

    try {
        const { items } = req.body;
        let createdOrder;

        await session.withTransaction(async () => {
            const orderItems = [];

            for (const item of items) {
                const product = await Product.findOne({
                    _id: item.productId,
                    status: "active"
                }).session(session);

                if (!product) {
                    const error = new Error(
                        `Product ${item.productId} not found or inactive`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                if (product.stock < item.quantity) {
                    const error = new Error(
                        `Insufficient stock for ${product.name}`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // Use sale price when available; otherwise use regular price.
                const unitPrice = product.salePrice ?? product.price;

                // Atomically reduce stock only if sufficient stock remains.
                const stockUpdate = await Product.updateOne(
                    {
                        _id: product._id,
                        status: "active",
                        stock: { $gte: item.quantity }
                    },
                    {
                        $inc: { stock: -item.quantity }
                    },
                    { session }
                );

                if (stockUpdate.modifiedCount !== 1) {
                    const error = new Error(
                        `Insufficient stock for ${product.name}`
                    );
                    error.statusCode = 409;
                    throw error;
                }

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    sku: product.sku,
                    quantity: item.quantity,
                    unitPrice,
                    subtotal: unitPrice * item.quantity
                });
            }

            // Customer, prices and total are controlled by the backend.
            const orders = await Order.create(
                [{
                    customer: req.user._id,
                    items: orderItems
                }],
                { session }
            );

            createdOrder = orders[0];
        });

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: createdOrder
        });
    } catch (error) {
        // return res.status(500).json({
        //     success: false,
        //     message: "Internal server error"
        // });
        next(error);
    } finally {
        await session.endSession();
    }
};

// GET /api/v1/orders/my-orders
// Customer: Get their own orders
export const getMyOrders = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const filter = { customer: req.user._id };

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("items.product", "name sku"),

            Order.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET /api/v1/orders
// Admin: Get all orders
export const getAllOrders = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("customer", "name email")
                .populate("items.product", "name sku"),

            Order.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET /api/v1/orders/:id
// Customer: Own order only; Admin: Any order
export const getOrderById = async (req, res, next) => {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID format"
            });
        }
        const order = await Order.findById(req.params.id)
            .populate("customer", "name email")
            .populate("items.product", "name sku");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const isAdmin = req.user.role === "admin";
        const isOwner =
            order.customer._id.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this order"
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// PATCH /api/v1/orders/:id/status
// Admin: Update order status
export const updateOrderStatus = async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID format"
        });
    }
    const session = await mongoose.startSession();

    try {
        const { status } = req.body;
        let updatedOrder;

        await session.withTransaction(async () => {

            const order = await Order.findById(req.params.id).session(session);

            if (!order) {
                const error = new Error("Order not found");
                error.statusCode = 404;
                throw error;
            }

            if (order.status === "cancelled" || order.status === "delivered") {
                const error = new Error(
                    `A ${order.status} order cannot be changed`
                );
                error.statusCode = 400;
                throw error;
            }

            // Restore stock only when an order is cancelled.
            if (status === "cancelled") {
                for (const item of order.items) {
                    const result = await Product.updateOne(
                        { _id: item.product },
                        { $inc: { stock: item.quantity } },
                        { session }
                    );

                    if (result.matchedCount !== 1) {
                        const error = new Error(
                            `Product ${item.name} is no longer available for stock restoration`
                        );
                        error.statusCode = 409;
                        throw error;
                    }
                }
            }

            order.status = status;
            await order.save({ session });

            updatedOrder = order;
        });

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: updatedOrder
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } finally {
        await session.endSession();
    }
};
