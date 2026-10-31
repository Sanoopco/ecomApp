import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

        const existing = await User.findOne({ email });
        if (existing) {
            console.log("Admin already exists:", email);
            return;
        }

        await User.create({
            name: process.env.ADMIN_NAME || "Admin",
            email,
            password: process.env.ADMIN_PASSWORD, // hashed by the pre-save hook
            role: "admin",
        });

        console.log("Admin created:", email);
    } catch (err) {
        console.error("Seeding failed:", err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedAdmin();