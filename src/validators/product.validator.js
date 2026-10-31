import { z } from "zod";

// Create product
export const createProductSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Product name must contain at least 2 characters")
            .max(150, "Product name cannot exceed 150 characters"),

        sku: z
            .string()
            .trim()
            .min(2, "SKU is required")
            .max(50, "SKU cannot exceed 50 characters")
            .regex(/^[a-zA-Z0-9_-]+$/, "Invalid SKU format"),

        description: z
            .string()
            .trim()
            .max(2000, "Description cannot exceed 2000 characters")
            .optional(),

        price: z
            .number()
            .min(0, "Price cannot be negative"),

        salePrice: z
            .number()
            .min(0, "Sale price cannot be negative")
            .optional(),

        stock: z
            .number()
            .int("Stock must be a whole number")
            .min(0, "Stock cannot be negative"),

        category: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID"),

        status: z
            .enum(["active", "inactive"])
            .optional(),
    })
    .strict()
    .refine(
        (data) =>
            data.salePrice === undefined ||
            data.salePrice <= data.price,
        {
            message: "Sale price cannot exceed regular price",
            path: ["salePrice"],
        }
    );

// Update product
export const updateProductSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2)
            .max(150)
            .optional(),

        sku: z
            .string()
            .trim()
            .min(2)
            .max(50)
            .regex(/^[a-zA-Z0-9_-]+$/)
            .optional(),

        description: z
            .string()
            .trim()
            .max(2000)
            .optional(),

        price: z
            .number()
            .min(0)
            .optional(),

        salePrice: z
            .number()
            .min(0)
            .nullable()
            .optional(),

        stock: z
            .number()
            .int()
            .min(0)
            .optional(),

        category: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID")
            .optional(),

        status: z
            .enum(["active", "inactive"])
            .optional(),
    })
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required"
    )
    .refine(
        (data) =>
            data.price === undefined ||
            data.salePrice === undefined ||
            data.salePrice === null ||
            data.salePrice <= data.price,
        {
            message: "Sale price cannot exceed regular price",
            path: ["salePrice"],
        }
    );