import { z } from "zod";

// Create order
export const createOrderSchema = z
    .object({
        items: z
            .array(
                z
                    .object({
                        productId: z
                            .string()
                            .regex(
                                /^[0-9a-fA-F]{24}$/,
                                "Invalid product ID"
                            ),

                        quantity: z
                            .number()
                            .int("Quantity must be a whole number")
                            .min(1, "Quantity must be at least 1"),
                    })
                    .strict()
            )
            .min(1, "An order must contain at least one product")
            .max(50, "An order cannot contain more than 50 items"),
    })
    .strict()
    .refine(
        (data) => {
            const productIds = data.items.map(
                (item) => item.productId
            );

            return new Set(productIds).size === productIds.length;
        },
        {
            message: "Duplicate products are not allowed in an order",
            path: ["items"],
        }
    );

// Update order status (Admin)
export const updateOrderStatusSchema = z
    .object({
        status: z.enum([
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
        ]),
    })
    .strict();