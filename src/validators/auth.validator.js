import { z } from "zod";

export const registerSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Name must contain at least 2 characters")
            .max(50, "Name cannot exceed 50 characters"),

        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase()),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters"),
        repassword: z
            .string()
            .min(1, "Please confirm your password"),

    })
    .strict()
    .refine((data) => data.password === data.repassword, {
        message: "Passwords do not match",
        path: ["repassword"],
    });

export const loginSchema = z
    .object({
        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase()),

        password: z
            .string()
            .min(1, "Password is required"),
    })
    .strict();