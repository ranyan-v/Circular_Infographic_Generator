
/*
 * Circular Infographic Generator
 * Geometry Engine
 *
 * Developer: ran.yan
 * Email: ran.yan.v@outlook.com
 */

function calculateCategoryLayout(
    categories,
    distributionMode,
    categoryGap,
    startingAngle
) {
    if (!categories || categories.length === 0) {
        throw new Error("At least one category is required.");
    }

    if (categoryGap < 0) {
        throw new Error("Category Gap cannot be negative.");
    }

    var categoryCount = categories.length;
    var availableAngle = 360 - categoryCount * categoryGap;

    if (availableAngle <= 0) {
        throw new Error("Category Gap is too large.");
    }

    var totalItems = 0;
    var totalManualAngle = 0;
    var i;

    for (i = 0; i < categoryCount; i++) {
        var category = categories[i];

        if (category.itemCount <= 0) {
            throw new Error(
                "Each category must contain at least one item."
            );
        }

        totalItems += category.itemCount;

        if (distributionMode === "manual") {
            if (typeof category.angle !== "number" ||
                category.angle <= 0) {
                throw new Error(
                    "Invalid manual angle in category: " +
                    category.name
                );
            }

            totalManualAngle += category.angle;
        }
    }

    if (
        distributionMode !== "equal" &&
        distributionMode !== "proportional" &&
        distributionMode !== "manual"
    ) {
        throw new Error("Invalid distribution mode.");
    }

    if (
        distributionMode === "manual" &&
        totalManualAngle > availableAngle + 0.000001
    ) {
        throw new Error(
            "Total category angles exceed available angle."
        );
    }

    var result = [];
    var currentAngle = startingAngle;

    for (i = 0; i < categoryCount; i++) {
        var currentCategory = categories[i];
        var categoryAngle;

        if (distributionMode === "equal") {
            categoryAngle = availableAngle / categoryCount;
        } else if (distributionMode === "proportional") {
            categoryAngle =
                availableAngle *
                (currentCategory.itemCount / totalItems);
        } else {
            categoryAngle = currentCategory.angle;
        }

        var startAngle = currentAngle;
        var endAngle = startAngle + categoryAngle;

        result.push({
            name: currentCategory.name,
            itemCount: currentCategory.itemCount,
            startAngle: startAngle,
            endAngle: endAngle,
            angle: categoryAngle
        });

        currentAngle = endAngle + categoryGap;
    }

    return result;
}
