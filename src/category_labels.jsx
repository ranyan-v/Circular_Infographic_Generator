/*
 * Circular Infographic Generator
 * Category Label Drawing
 *
 * Creates editable horizontal or type-on-a-path labels from category layout
 * records. Layout centers and radii are millimeters; Illustrator coordinates
 * and font sizes are points; angles are degrees. Coordinates are artboard-based.
 */

function drawCategoryLabels(categoryLayouts, options) {
    function requireFiniteCategoryLabelNumber(value, description) {
        if (typeof value !== "number" || !isFinite(value)) {
            throw new Error(description + " must be a finite number.");
        }
    }

    function makeCategoryLabelColor(channels) {
        var color = new RGBColor();
        var channelIndex;
        for (channelIndex = 0; channelIndex < 3; channelIndex++) {
            requireFiniteCategoryLabelNumber(channels[channelIndex],
                "Text color channel");
            if (channels[channelIndex] < 0 || channels[channelIndex] > 255) {
                throw new Error("Text color channels must be from 0 to 255.");
            }
        }
        color.red = channels[0];
        color.green = channels[1];
        color.blue = channels[2];
        return color;
    }

    function getCategoryLabelPoint(cxPt, cyPt, radiusPt, angleDegrees) {
        var radians = angleDegrees * Math.PI / 180;
        return [
            cxPt + radiusPt * Math.cos(radians),
            cyPt - radiusPt * Math.sin(radians)
        ];
    }

    function addCategoryLabelArc(pathItem, cxPt, cyPt, radiusPt,
        startDegrees, endDegrees) {
        var range = endDegrees - startDegrees;
        var segmentCount = Math.ceil(Math.abs(range) / 90);
        var delta = range / segmentCount;
        var controlScale = (4 / 3) * Math.tan(delta * Math.PI / 720);
        var pointCount = segmentCount + 1;
        var anchors = [];
        var anchorIndex;
        for (anchorIndex = 0; anchorIndex < pointCount; anchorIndex++) {
            var anchorAngle = startDegrees + anchorIndex * delta;
            anchors.push(getCategoryLabelPoint(cxPt, cyPt, radiusPt,
                anchorAngle));
        }
        pathItem.setEntirePath(anchors);

        var index;
        for (index = 0; index < pointCount; index++) {
            var angle = startDegrees + index * delta;
            var radians = angle * Math.PI / 180;
            var anchor = getCategoryLabelPoint(cxPt, cyPt, radiusPt, angle);
            var tangent = [-Math.sin(radians), -Math.cos(radians)];
            var point = pathItem.pathPoints[index];
            point.anchor = anchor;
            point.pointType = PointType.SMOOTH;
            point.leftDirection = [anchor[0], anchor[1]];
            point.rightDirection = [anchor[0], anchor[1]];

            if (index < segmentCount) {
                var outgoing = [
                    anchor[0] + controlScale * radiusPt * tangent[0],
                    anchor[1] + controlScale * radiusPt * tangent[1]
                ];
                point.rightDirection = outgoing;
            }
            if (index > 0) {
                var incoming = [
                    anchor[0] - controlScale * radiusPt * tangent[0],
                    anchor[1] - controlScale * radiusPt * tangent[1]
                ];
                point.leftDirection = incoming;
            }
        }
        pathItem.closed = false;
        pathItem.filled = false;
        pathItem.stroked = false;
    }

    function categoryGroupName(category, index) {
        var number = String(index + 1);
        if (number.length < 2) {
            number = "0" + number;
        }
        return "Category " + number + " - " + category.name;
    }

    var settings = options || {};
    if (!(categoryLayouts instanceof Array) || categoryLayouts.length === 0) {
        throw new Error("At least one category layout is required.");
    }
    if (!settings || typeof settings !== "object") {
        throw new Error("Category label options are required.");
    }

    var mode = settings.mode || "curved";
    var centerXmm = settings.centerXmm;
    var centerYmm = settings.centerYmm;
    var categoryArcRadiusMm = settings.categoryArcRadiusMm;
    var radialOffsetMm = (typeof settings.radialOffsetMm === "undefined") ?
        0 : settings.radialOffsetMm;
    var fontSizePt = (typeof settings.fontSizePt === "undefined") ?
        12 : settings.fontSizePt;
    var textColorChannels = (typeof settings.textColor === "undefined") ?
        [30, 45, 65] : settings.textColor;
    var mmToPoints = 72 / 25.4;

    if (mode !== "curved" && mode !== "horizontal") {
        throw new Error("Category label mode must be curved or horizontal.");
    }
    requireFiniteCategoryLabelNumber(centerXmm, "Center X in millimeters");
    requireFiniteCategoryLabelNumber(centerYmm, "Center Y in millimeters");
    requireFiniteCategoryLabelNumber(categoryArcRadiusMm,
        "Category arc radius in millimeters");
    requireFiniteCategoryLabelNumber(radialOffsetMm,
        "Radial offset in millimeters");
    requireFiniteCategoryLabelNumber(fontSizePt, "Font size in points");
    var labelRadiusMm = categoryArcRadiusMm + radialOffsetMm;
    if (categoryArcRadiusMm <= 0 || labelRadiusMm <= 0 || fontSizePt <= 0) {
        throw new Error("Category arc radius, label radius, and font size " +
            "must be greater than zero.");
    }
    if (!(textColorChannels instanceof Array) ||
        textColorChannels.length !== 3) {
        throw new Error("Text color must be an RGB array with three channels.");
    }
    var textColor = makeCategoryLabelColor(textColorChannels);

    var categoryIndex;
    for (categoryIndex = 0; categoryIndex < categoryLayouts.length;
        categoryIndex++) {
        var category = categoryLayouts[categoryIndex];
        if (!category || typeof category.name !== "string" ||
            category.name.length === 0) {
            throw new Error("Category " + (categoryIndex + 1) +
                " must have a non-empty name.");
        }
        requireFiniteCategoryLabelNumber(category.startAngle,
            "Category start angle");
        requireFiniteCategoryLabelNumber(category.endAngle,
            "Category end angle");
        var categorySweep = category.endAngle - category.startAngle;
        if (categorySweep <= 0 || categorySweep >= 360) {
            throw new Error("Category label arcs must span more than 0 and " +
                "less than 360 degrees.");
        }
    }

    if (app.documents.length === 0) {
        throw new Error("Open an Illustrator document before drawing labels.");
    }

    var previousCoordinateSystem = app.coordinateSystem;
    var resultGroup;
    try {
        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
        var documentRef = app.activeDocument;
        var centerXPt = centerXmm * mmToPoints;
        var centerYPt = centerYmm * mmToPoints;
        var labelRadiusPt = labelRadiusMm * mmToPoints;
        resultGroup = documentRef.activeLayer.groupItems.add();
        resultGroup.name = "Category Labels - " + mode;

        for (categoryIndex = 0; categoryIndex < categoryLayouts.length;
            categoryIndex++) {
            category = categoryLayouts[categoryIndex];
            var categoryGroup = resultGroup.groupItems.add();
            categoryGroup.name = categoryGroupName(category, categoryIndex);

            var labelFrame;
            if (mode === "horizontal") {
                var midpointAngle = category.startAngle +
                    (category.endAngle - category.startAngle) / 2;
                var midpoint = getCategoryLabelPoint(centerXPt, centerYPt,
                    labelRadiusPt, midpointAngle);
                labelFrame = categoryGroup.textFrames.add();
                labelFrame.contents = category.name;
                labelFrame.textRange.characterAttributes.size = fontSizePt;
                labelFrame.textRange.characterAttributes.fillColor = textColor;
                labelFrame.textRange.paragraphAttributes.justification =
                    Justification.CENTER;
                if (settings.fontName) {
                    labelFrame.textRange.characterAttributes.textFont =
                        app.textFonts.getByName(settings.fontName);
                }

                // TextFrame.position is its top-left; use the measured frame
                // bounds to place its visual center on the category midpoint.
                var frameBounds = labelFrame.geometricBounds;
                var frameWidth = frameBounds[2] - frameBounds[0];
                var frameHeight = frameBounds[1] - frameBounds[3];
                labelFrame.position = [
                    midpoint[0] - frameWidth / 2,
                    midpoint[1] + frameHeight / 2
                ];
                labelFrame.name = "Category Label - " + category.name;
            } else {
                var middleAngle = category.startAngle +
                    (category.endAngle - category.startAngle) / 2;
                var normalizedAngle = middleAngle % 360;
                if (normalizedAngle < 0) {
                    normalizedAngle += 360;
                }
                var middleSine = Math.sin(normalizedAngle * Math.PI / 180);

                // In the established angle convention, the upper half uses a
                // reversed path for left-to-right reading; the lower half
                // follows the supplied increasing-angle direction.
                var reversePath = middleSine > 0.000000000001;
                var pathStart = reversePath ? category.endAngle :
                    category.startAngle;
                var pathEnd = reversePath ? category.startAngle :
                    category.endAngle;

                var textArc = categoryGroup.pathItems.add();
                textArc.name = "Category Label Path - " + category.name;
                addCategoryLabelArc(textArc, centerXPt, centerYPt,
                    labelRadiusPt, pathStart, pathEnd);
                labelFrame = categoryGroup.textFrames.pathText(textArc);
                labelFrame.name = "Category Label - " + category.name;
                labelFrame.contents = category.name;
                labelFrame.textRange.characterAttributes.size = fontSizePt;
                labelFrame.textRange.characterAttributes.fillColor = textColor;
                labelFrame.textRange.paragraphAttributes.justification =
                    Justification.CENTER;
                if (settings.fontName) {
                    labelFrame.textRange.characterAttributes.textFont =
                        app.textFonts.getByName(settings.fontName);
                }

                // Reversing an open path also reverses its default text side.
                // Toggle polarity with path direction, and again for an
                // inward radial offset, to keep text on the requested side.
                var flipTextSide = reversePath;
                if (radialOffsetMm < 0) {
                    flipTextSide = !flipTextSide;
                }
                labelFrame.textPath.polarity = flipTextSide ?
                    PolarityValues.NEGATIVE : PolarityValues.POSITIVE;
            }
        }
        return resultGroup;
    } finally {
        app.coordinateSystem = previousCoordinateSystem;
    }
}
