import express from "express";
import helmet from "helmet";
import cors from "cors";
import indexRouter from "./routes/index.js";

const app = express();

// Security headers
app.use(helmet());

// JSON request parsing
app.use(express.json({ limit: "100kb" }));

// Configure CORS
app.use(cors());

// Health check
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "E-commerce API is running",
    });
});
app.use("/api/v1", indexRouter);

// Global error handler — must be LAST middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

export default app;