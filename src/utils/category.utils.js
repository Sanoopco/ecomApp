import Category from "../models/Category.js";
const getDescendantIds = async (categoryId) => {
    const descendants = [];
    let currentLevel = [categoryId.toString()];

    while (currentLevel.length > 0) {
        const children = await Category.find({
            parent: { $in: currentLevel }
        }).select("_id");

        currentLevel = children.map((item) => item._id.toString());
        descendants.push(...currentLevel);
    }

    return descendants;
};

export default getDescendantIds;