import jwt from "jsonwebtoken";

export const generateToken = (user) => {
    return jwt.sign(
        {
            sub: user._id.toString(),
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        }
    );
};