
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import getDescendantIds from "../utils/category.utils.js";

// GET /api/v1/categories
// Get all active categories
export const getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({
            isActive: true
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET /api/v1/categories/tree
// Get unlimited-depth category hierarchy
export const getCategoryTree = async (req, res, next) => {
    try {
        const categories = await Category.find({
            isActive: true
        }).sort({ name: 1 }).lean();

        const categoryMap = new Map();

        categories.forEach((category) => {
            categoryMap.set(category._id.toString(), {
                ...category,
                children: []
            });
        });

        const tree = [];

        categories.forEach((category) => {
            const current = categoryMap.get(category._id.toString());

            if (
                category.parent &&
                categoryMap.has(category.parent.toString())
            ) {
                categoryMap
                    .get(category.parent.toString())
                    .children.push(current);
            } else {
                tree.push(current);
            }
        });

        res.status(200).json({
            success: true,
            data: tree
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET /api/v1/categories/:id
export const getCategoryById = async (req, res, next) => {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID format"
            });
        }

        const category = await Category.findOne({
            _id: req.params.id,
            isActive: true
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// POST /api/v1/categories
// Admin: Create category
export const createCategory = async (req, res, next) => {
    try {
        const { name, description, parent } = req.body;

        if (parent) {
            const parentCategory = await Category.findById(parent);

            if (!parentCategory || !parentCategory.isActive) {
                return res.status(400).json({
                    success: false,
                    message: "Parent category not found or inactive"
                });
            }
        }

        const category = await Category.create({
            name,
            description,
            parent: parent || null
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// PUT /api/v1/categories/:id
// Admin: Update category
export const updateCategory = async (req, res, next) => {
    try {
        const { name, description, parent, isActive } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        if (parent !== undefined) {
            if (parent === null) {
                category.parent = null;
            } else {
                const parentCategory = await Category.findById(parent);

                if (!parentCategory || !parentCategory.isActive) {
                    return res.status(400).json({
                        success: false,
                        message: "Parent category not found or inactive"
                    });
                }

                if (parent === category._id.toString()) {
                    return res.status(400).json({
                        success: false,
                        message: "A category cannot be its own parent"
                    });
                }

                const descendants = await getDescendantIds(category._id);

                if (descendants.includes(parent)) {
                    return res.status(400).json({
                        success: false,
                        message: "Cannot move a category under its own descendant"
                    });
                }

                category.parent = parent;
            }
        }

        if (name !== undefined) category.name = name;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// DELETE /api/v1/categories/:id
// Admin: Delete category
export const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const descendants = await getDescendantIds(category._id);
        const categoryIds = [category._id, ...descendants];

        // Prevent deleting categories that contain products
        const productsExist = await Product.exists({
            category: { $in: categoryIds }
        });

        if (productsExist) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete category because products are assigned to it or its descendants"
            });
        }

        // Prevent orphaned child categories
        await Category.updateMany(
            { parent: category._id },
            { $set: { parent: category.parent || null } }
        );

        await Category.findByIdAndDelete(category._id);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
