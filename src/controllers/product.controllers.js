
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import getDescendantIds from "../utils/category.utils.js";


// GET /api/v1/products
// Search, filter, sort and paginate products
export const getAllProducts = async (req, res, next) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            sort = "newest",
            page = 1,
            limit = 10
        } = req.query;

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const filter = { status: "active" };

        // Search by product name or description
        if (search) {
            filter.$text = { $search: search };
        }

        // Filter by category and all its descendants
        if (category) {
            const selectedCategory = await Category.findOne({
                _id: category,
                isActive: true
            }).lean();

            if (!selectedCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }

            const descendants = await getDescendantIds(category);

            filter.category = {
                $in: [category, ...descendants]
            };
        }

        // Price filtering
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        // Sorting
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            name_asc: { name: 1 },
            name_desc: { name: -1 }
        };

        if (!sortOptions[sort]) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort option"
            });
        }

        const skip = (pageNumber - 1) * limitNumber;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort(sortOptions[sort])
                .skip(skip)
                .limit(limitNumber)
                .populate("category", "name")
                .lean(),

            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET /api/v1/products/:id
// Get one active product
export const getProductById = async (req, res, next) => {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            status: "active"
        }).populate("category", "name");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// POST /api/v1/products
// Admin: Create product
export const createProduct = async (req, res, next) => {
    try {
        const { category } = req.body;

        const categoryExists = await Category.findOne({
            _id: category,
            isActive: true
        });

        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "Category not found or inactive"
            });
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// PUT /api/v1/products/:id
// Admin: Update product
export const updateProduct = async (req, res, next) => {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const updates = req.body;

        if (updates.category !== undefined) {
            const categoryExists = await Category.findOne({
                _id: updates.category,
                isActive: true
            });

            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "Category not found or inactive"
                });
            }
        }

        const finalPrice = updates.price ?? product.price;
        const finalSalePrice =
            updates.salePrice !== undefined
                ? updates.salePrice
                : product.salePrice;

        if (
            finalSalePrice != null &&
            finalSalePrice > finalPrice
        ) {
            return res.status(400).json({
                success: false,
                message: "Sale price cannot exceed regular price"
            });
        }

        Object.assign(product, updates);
        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// DELETE /api/v1/products/:id
// Admin: Delete product
export const deleteProduct = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
