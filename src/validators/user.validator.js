import { z } from "zod";

// Update user profile
export const updateProfileSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Name must contain at least 2 characters")
            .max(50, "Name cannot exceed 50 characters")
            .optional(),

        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase())
            .optional(),
    })
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required"
    );

// Activate or deactivate user (Admin)
export const updateUserStatusSchema = z
    .object({
        isActive: z.boolean({
            error: "isActive must be true or false",
        }),
    })
    .strict();