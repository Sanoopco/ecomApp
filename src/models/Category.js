import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
            index: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent a category from being its own parent or an ancestor of itself.
categorySchema.pre("save", async function () {
    if (!this.isModified("parent") || !this.parent) return;

    if (this._id && this._id.equals(this.parent)) {
        throw new Error("A category cannot be its own parent");
    }

    let currentParentId = this.parent;
    const visited = new Set();

    while (currentParentId) {
        const currentId = currentParentId.toString();

        if (this._id && currentId === this._id.toString()) {
            throw new Error("Circular category relationship detected");
        }

        if (visited.has(currentId)) {
            throw new Error("Existing circular category relationship detected");
        }

        visited.add(currentId);

        const parentCategory = await mongoose
            .model("Category")
            .findById(currentParentId)
            .select("parent");

        if (!parentCategory) {
            throw new Error("Parent category does not exist");
        }

        currentParentId = parentCategory.parent;
    }
});

categorySchema.index({ parent: 1, isActive: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;