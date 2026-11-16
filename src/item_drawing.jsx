/*
 * Circular Infographic Generator
 * Item Drawing Engine
 *
 * Creates editable icon placeholder paths and horizontal point-text labels
 * from calculateItemLayout() output. Layout coordinates are millimeters;
 * Illustrator object coordinates are points. Item positions are interpreted
 * in artboard coordinates: X increases right and downward positions have
 * decreasing Y values. The caller's coordinate-system setting is restored.
 */

function drawItemLayouts(layoutCategories, options) {
    function requireFiniteItemDrawingNumber(value, label) {
        if (typeof value !== "number" || !isFinite(value)) {
            throw new Error(label + " must be a finite number.");
        }
    }

    function copyRgbColor(channels, label) {
        if (!(channels instanceof Array) || channels.length !== 3) {
            throw new Error(label + " must be an RGB array with three channels.");
        }

        var color = new RGBColor();
        var channelIndex;
        for (channelIndex = 0; channelIndex < 3; channelIndex++) {
            requireFiniteItemDrawingNumber(channels[channelIndex], label);
            if (channels[channelIndex] < 0 || channels[channelIndex] > 255) {
                throw new Error(label + " channels must be between 0 and 255.");
            }
        }

        color.red = channels[0];
        color.green = channels[1];
        color.blue = channels[2];
        return color;
    }

    function identityText(value) {
        return String(value);
    }

    var settings = options || {};
    var iconDiameterMm = (typeof settings.iconDiameterMm === "undefined") ?
        12 : settings.iconDiameterMm;
    var iconStrokeWidthMm =
        (typeof settings.iconStrokeWidthMm === "undefined") ?
            0.5 : settings.iconStrokeWidthMm;
    var textOffsetMm = (typeof settings.textOffsetMm === "undefined") ?
        3 : settings.textOffsetMm;
    var fontSizePt = (typeof settings.fontSizePt === "undefined") ?
        10 : settings.fontSizePt;
    var iconStrokeChannels =
        (typeof settings.iconStrokeColor === "undefined") ?
            [40, 40, 40] : settings.iconStrokeColor;
    var iconFillChannels = (typeof settings.iconFillColor === "undefined") ?
        [255, 255, 255] : settings.iconFillColor;
    var textChannels = (typeof settings.textColor === "undefined") ?
        [25, 25, 25] : settings.textColor;

    if (!(layoutCategories instanceof Array) || layoutCategories.length === 0) {
        throw new Error("At least one laid-out category is required.");
    }
    requireFiniteItemDrawingNumber(iconDiameterMm, "Icon diameter");
    requireFiniteItemDrawingNumber(iconStrokeWidthMm, "Icon stroke width");
    requireFiniteItemDrawingNumber(textOffsetMm, "Text offset");
    requireFiniteItemDrawingNumber(fontSizePt, "Font size");
    if (iconDiameterMm <= 0 || iconStrokeWidthMm < 0 ||
        textOffsetMm < 0 || fontSizePt <= 0) {
        throw new Error("Icon diameter and font size must be positive; " +
            "stroke width and text offset cannot be negative.");
    }

    // Validate layout records before creating Illustrator artwork.
    var categoryIndex;
    for (categoryIndex = 0; categoryIndex < layoutCategories.length;
        categoryIndex++) {
        var category = layoutCategories[categoryIndex];
        if (!category || typeof category !== "object" ||
            category.categoryIndex === undefined ||
            category.categoryIndex === null || typeof category.name !== "string" ||
            !(category.items instanceof Array) || category.items.length === 0) {
            throw new Error("Invalid category layout at position " +
                categoryIndex + ".");
        }

        var itemIndex;
        for (itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
            var item = category.items[itemIndex];
            if (!item || typeof item !== "object" ||
                item.itemIndex === undefined || item.itemIndex === null ||
                typeof item.name !== "string" ||
                (item.side !== "left" && item.side !== "right")) {
                throw new Error("Invalid item layout at category position " +
                    categoryIndex + ", item position " + itemIndex + ".");
            }
            requireFiniteItemDrawingNumber(item.xMm, "Item X coordinate");
            requireFiniteItemDrawingNumber(item.yMm, "Item Y coordinate");
        }
    }

    var iconStrokeColor = copyRgbColor(iconStrokeChannels,
        "Icon stroke color");
    var iconFillColor = copyRgbColor(iconFillChannels, "Icon fill color");
    var textColor = copyRgbColor(textChannels, "Text color");

    if (app.documents.length === 0) {
        throw new Error("Open an Illustrator document before drawing items.");
    }

    var previousCoordinateSystem = app.coordinateSystem;
    var rootGroup;
    try {
        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;

        var documentRef = app.activeDocument;
        rootGroup = documentRef.activeLayer.groupItems.add();
        rootGroup.name = "Items";

        var mmToPoints = 72 / 25.4;
        var diameterPt = iconDiameterMm * mmToPoints;
        var strokeWidthPt = iconStrokeWidthMm * mmToPoints;
        var textOffsetPt = textOffsetMm * mmToPoints;

        for (categoryIndex = 0; categoryIndex < layoutCategories.length;
            categoryIndex++) {
            category = layoutCategories[categoryIndex];
            var categoryGroup = rootGroup.groupItems.add();
            categoryGroup.name = "Category " +
                identityText(category.categoryIndex) + " - " + category.name;

            for (itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
                item = category.items[itemIndex];
                var itemGroup = categoryGroup.groupItems.add();
                itemGroup.name = "Item " + identityText(item.itemIndex) +
                    " - " + item.name;

                // Layout centers are artboard-coordinate millimeters. Convert
                // each center coordinate from mm to points exactly once.
                var centerXPt = item.xMm * mmToPoints;
                var centerYPt = item.yMm * mmToPoints;
                var leftPt = centerXPt - diameterPt / 2;

                // In artboard coordinates Y becomes more negative downward,
                // so the ellipse's top bound is above its center (+ radius).
                var topPt = centerYPt + diameterPt / 2;

                var iconPath = itemGroup.pathItems.ellipse(
                    topPt,
                    leftPt,
                    diameterPt,
                    diameterPt
                );
                iconPath.name = "Icon Placeholder";
                iconPath.filled = true;
                iconPath.fillColor = iconFillColor;
                iconPath.stroked = (strokeWidthPt > 0);
                if (strokeWidthPt > 0) {
                    iconPath.strokeColor = iconStrokeColor;
                    iconPath.strokeWidth = strokeWidthPt;
                }

                var labelFrame = itemGroup.textFrames.add();
                labelFrame.name = "Text Label";
                labelFrame.contents = item.name;
                labelFrame.textRange.characterAttributes.size = fontSizePt;
                labelFrame.textRange.characterAttributes.fillColor = textColor;
                labelFrame.textRange.paragraphAttributes.justification =
                    (item.side === "right") ?
                        Justification.LEFT : Justification.RIGHT;

                // position is the text frame's top-left bounding-box point.
                // Positive Y is upward in this artboard coordinate convention.
                var labelWidthPt = labelFrame.width;
                var labelHeightPt = labelFrame.height;
                var labelLeftPt;
                if (item.side === "right") {
                    labelLeftPt = centerXPt + diameterPt / 2 + textOffsetPt;
                } else {
                    labelLeftPt = centerXPt - diameterPt / 2 - textOffsetPt -
                        labelWidthPt;
                }
                var labelTopPt = centerYPt + labelHeightPt / 2;
                labelFrame.position = [labelLeftPt, labelTopPt];
            }
        }

        return rootGroup;
    } finally {
        app.coordinateSystem = previousCoordinateSystem;
    }
}
