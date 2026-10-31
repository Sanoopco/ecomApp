import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        sku: {
            type: String,
            required: [true, "SKU is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"],
        },

        salePrice: {
            type: Number,
            min: [0, "Sale price cannot be negative"],
            validate: {
                validator: function (value) {
                    return value == null || value <= this.price;
                },
                message: "Sale price cannot be greater than regular price",
            },
        },

        stock: {
            type: Number,
            required: true,
            default: 0,
            min: [0, "Stock cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Stock must be a whole number",
            },
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Product category is required"],
            index: true,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// Useful for product listing and filtering
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: "text", description: "text" });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;