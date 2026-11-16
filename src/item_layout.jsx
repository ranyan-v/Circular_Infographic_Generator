/*
 * Circular Infographic Generator
 * Item Layout Engine
 *
 * Calculates item angles and positions only. This module does not create
 * Illustrator objects or convert millimeters to points.
 *
 * Developer: ran.yan
 * Email: ran.yan.v@outlook.com
 */

/*
 * categories: [{
 *     categoryIndex: stable identifier,
 *     name: string,
 *     startAngle: degrees,
 *     endAngle: degrees,
 *     items: [{ itemIndex: stable identifier, name: string,
 *               manualAngle: optional degrees }]
 * }]
 * options: {
 *     centerXmm: number,
 *     centerYmm: number,
 *     itemRadiusMm: positive number,
 *     itemGapDegrees: nonnegative number
 * }
 *
 * Returns category records containing positioned item records. Lengths are
 * in millimeters and angles are in degrees. Manual angles replace their
 * automatic slots without moving any other item.
 */
function calculateItemLayout(categories, options) {
    function requireFiniteNumber(value, description) {
        if (typeof value !== "number" || !isFinite(value)) {
            throw new Error(description + " must be a finite number.");
        }
    }

    if (!(categories instanceof Array) || categories.length === 0) {
        throw new Error("At least one category is required.");
    }
    if (!options || typeof options !== "object") {
        throw new Error("Item layout options are required.");
    }

    requireFiniteNumber(options.centerXmm, "Center X");
    requireFiniteNumber(options.centerYmm, "Center Y");
    requireFiniteNumber(options.itemRadiusMm, "Item Radius");
    requireFiniteNumber(options.itemGapDegrees, "Item Gap");

    if (options.itemRadiusMm <= 0) {
        throw new Error("Item Radius must be greater than zero.");
    }
    if (options.itemGapDegrees < 0) {
        throw new Error("Item Gap cannot be negative.");
    }

    var result = [];
    var categoryIndex;

    for (categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
        var category = categories[categoryIndex];
        if (!category || typeof category !== "object") {
            throw new Error("Category at position " + categoryIndex +
                " is invalid.");
        }
        if (category.categoryIndex === undefined ||
            category.categoryIndex === null) {
            throw new Error("Category at position " + categoryIndex +
                " is missing categoryIndex.");
        }
        if (typeof category.name !== "string") {
            throw new Error("Category at position " + categoryIndex +
                " must have a string name.");
        }

        requireFiniteNumber(category.startAngle,
            "Start angle for category " + category.name);
        requireFiniteNumber(category.endAngle,
            "End angle for category " + category.name);

        var categoryAngle = category.endAngle - category.startAngle;
        if (categoryAngle <= 0 || categoryAngle > 360) {
            throw new Error("Category " + category.name +
                " must have an angular range greater than zero and no more " +
                "than 360 degrees.");
        }

        if (!(category.items instanceof Array) || category.items.length === 0) {
            throw new Error("Category " + category.name +
                " must contain at least one item.");
        }

        var itemCount = category.items.length;
        var gapCount = itemCount - 1;
        var usableAngle = categoryAngle -
            gapCount * options.itemGapDegrees;
        if (usableAngle <= 0) {
            throw new Error("Item Gap leaves no positive-width item intervals " +
                "in category " + category.name + ".");
        }

        var cellAngle = usableAngle / itemCount;
        var positionedItems = [];
        var itemIndex;

        for (itemIndex = 0; itemIndex < itemCount; itemIndex++) {
            var item = category.items[itemIndex];
            if (!item || typeof item !== "object") {
                throw new Error("Item at position " + itemIndex +
                    " in category " + category.name + " is invalid.");
            }
            if (item.itemIndex === undefined || item.itemIndex === null) {
                throw new Error("Item at position " + itemIndex +
                    " in category " + category.name +
                    " is missing itemIndex.");
            }
            if (typeof item.name !== "string") {
                throw new Error("Item at position " + itemIndex +
                    " in category " + category.name +
                    " must have a string name.");
            }

            var itemAngle = category.startAngle + cellAngle / 2 +
                itemIndex * (cellAngle + options.itemGapDegrees);
            var isManual = (typeof item.manualAngle !== "undefined");

            if (isManual) {
                requireFiniteNumber(item.manualAngle,
                    "Manual angle for item " + item.name);

                var angleOffset =
                    (item.manualAngle - category.startAngle) % 360;
                if (angleOffset < 0) {
                    angleOffset += 360;
                }

                if (angleOffset <= 0 || angleOffset >= categoryAngle) {
                    throw new Error("Manual angle for item " + item.name +
                        " must be strictly inside category " +
                        category.name + ".");
                }
                itemAngle = item.manualAngle;
            }

            var radians = itemAngle * Math.PI / 180;
            var cosine = Math.cos(radians);
            var sine = Math.sin(radians);
            var xMm = options.centerXmm +
                options.itemRadiusMm * cosine;
            var yMm = options.centerYmm -
                options.itemRadiusMm * sine;

            // Trigonometric functions can return a tiny nonzero cosine at
            // exactly 90 or 270 degrees. Snap that numerical residue to the
            // center line so the specified vertical-axis side rule is stable.
            if (Math.abs(cosine) < 0.000000000001) {
                xMm = options.centerXmm;
            }

            positionedItems.push({
                categoryIndex: category.categoryIndex,
                itemIndex: item.itemIndex,
                name: item.name,
                angle: itemAngle,
                xMm: xMm,
                yMm: yMm,
                radialDistanceMm: options.itemRadiusMm,
                side: (xMm >= options.centerXmm) ? "right" : "left",
                isManual: isManual
            });
        }

        result.push({
            categoryIndex: category.categoryIndex,
            name: category.name,
            startAngle: category.startAngle,
            endAngle: category.endAngle,
            items: positionedItems
        });
    }

    return result;
}
