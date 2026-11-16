(function runCategoryLabelTests_2026() {
#include "../src/category_labels.jsx"

    function assertCategoryLabel(condition, message) {
        if (!condition) {
            throw new Error("Category label test failed: " + message);
        }
    }

    function findCategoryLabelGroup(rootGroup, categoryName) {
        var groupIndex;
        for (groupIndex = 0; groupIndex < rootGroup.groupItems.length;
            groupIndex++) {
            var candidate = rootGroup.groupItems[groupIndex];
            if (candidate.name.indexOf(" - " + categoryName) >= 0) {
                return candidate;
            }
        }
        return null;
    }

    function getArtboardCenterMm(documentRef) {
        var artboard = documentRef.artboards[
            documentRef.artboards.getActiveArtboardIndex()
        ];
        var rect = artboard.artboardRect;
        var topLeft = documentRef.convertCoordinate(
            [rect[0], rect[1]],
            CoordinateSystem.DOCUMENTCOORDINATESYSTEM,
            CoordinateSystem.ARTBOARDCOORDINATESYSTEM
        );
        var bottomRight = documentRef.convertCoordinate(
            [rect[2], rect[3]],
            CoordinateSystem.DOCUMENTCOORDINATESYSTEM,
            CoordinateSystem.ARTBOARDCOORDINATESYSTEM
        );
        var pointsToMm = 25.4 / 72;
        return {
            x: ((topLeft[0] + bottomRight[0]) / 2) * pointsToMm,
            y: ((topLeft[1] + bottomRight[1]) / 2) * pointsToMm,
            widthMm: Math.abs(bottomRight[0] - topLeft[0]) * pointsToMm,
            heightMm: Math.abs(bottomRight[1] - topLeft[1]) * pointsToMm
        };
    }

    function checkCategoryLabelSet(rootGroup, layouts, mode, center, radiusMm) {
        assertCategoryLabel(rootGroup.typename === "GroupItem",
            mode + " mode should return an Illustrator group");
        assertCategoryLabel(rootGroup.groupItems.length === layouts.length,
            mode + " mode should preserve each category group");

        var categoryIndex;
        for (categoryIndex = 0; categoryIndex < layouts.length;
            categoryIndex++) {
            var category = layouts[categoryIndex];
            var categoryGroup = findCategoryLabelGroup(rootGroup,
                category.name);
            assertCategoryLabel(categoryGroup !== null,
                "category identity should be preserved for " + category.name);
            assertCategoryLabel(categoryGroup.textFrames.length === 1,
                "each category should contain one editable label");

            var label = categoryGroup.textFrames[0];
            assertCategoryLabel(label.typename === "TextFrame",
                "label should remain an editable native text frame");
            assertCategoryLabel(label.contents === category.name,
                "label contents should match its category name");
            assertCategoryLabel(
                label.textRange.paragraphAttributes.justification ===
                    Justification.CENTER,
                "category label text should be centered");
            assertCategoryLabel(
                label.textRange.characterAttributes.size === 11,
                "configured 11 pt font size should be applied");

            if (mode === "curved") {
                assertCategoryLabel(label.kind === TextType.PATHTEXT,
                    "curved mode should create editable path text");
                assertCategoryLabel(label.textPath.pathPoints.length >= 2,
                    "curved label should retain its editable text path");
                var middleAngleForDirection = category.startAngle +
                    (category.endAngle - category.startAngle) / 2;
                var normalizedForDirection = middleAngleForDirection % 360;
                if (normalizedForDirection < 0) {
                    normalizedForDirection += 360;
                }
                var reverseForReadability = Math.sin(
                    normalizedForDirection * Math.PI / 180) > 0.000000000001;
                var expectedPolarity = reverseForReadability ?
                    PolarityValues.NEGATIVE : PolarityValues.POSITIVE;
                assertCategoryLabel(label.textPath.polarity === expectedPolarity,
                    "curved text side polarity should track its path direction");
            } else {
                assertCategoryLabel(label.kind === TextType.POINTTEXT,
                    "horizontal mode should create editable point text");
                var middleAngle = category.startAngle +
                    (category.endAngle - category.startAngle) / 2;
                var radians = middleAngle * Math.PI / 180;
                var expectedX = (center.x + radiusMm * Math.cos(radians)) *
                    72 / 25.4;
                var expectedY = (center.y - radiusMm * Math.sin(radians)) *
                    72 / 25.4;
                var bounds = label.geometricBounds;
                var measuredX = (bounds[0] + bounds[2]) / 2;
                var measuredY = (bounds[1] + bounds[3]) / 2;
                assertCategoryLabel(Math.abs(measuredX - expectedX) < 0.5,
                    "horizontal label bounds should center on its arc midpoint X");
                assertCategoryLabel(Math.abs(measuredY - expectedY) < 0.5,
                    "horizontal label bounds should center on its arc midpoint Y");
            }
        }
    }

    if (app.documents.length === 0) {
        throw new Error("Open an Illustrator document with a visible artboard " +
            "before running this test.");
    }

    var previousCoordinateSystem = app.coordinateSystem;
    var curvedRoot_2026;
    var horizontalRoot_2026;
    var testError;
    var restoreResult = "not checked";
    try {
        app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        var documentRef_2026 = app.activeDocument;
        var center_2026 = getArtboardCenterMm(documentRef_2026);
        var radius_2026 = Math.min(center_2026.widthMm,
            center_2026.heightMm) * 0.16;
        var categories_2026 = [
            { name: "Wrap", startAngle: 350, endAngle: 390 },
            { name: "NE", startAngle: 390, endAngle: 440 },
            { name: "NW", startAngle: 440, endAngle: 500 },
            { name: "Axis", startAngle: 500, endAngle: 580 },
            { name: "SW", startAngle: 580, endAngle: 630 },
            { name: "SE", startAngle: 630, endAngle: 690 },
            { name: "End", startAngle: 690, endAngle: 710 }
        ];
        var labelOptions_2026 = {
            centerXmm: center_2026.x,
            centerYmm: center_2026.y,
            categoryArcRadiusMm: radius_2026,
            radialOffsetMm: 5,
            fontSizePt: 11,
            textColor: [30, 45, 65]
        };

        var coordinateSystemBeforeCurved_2026 = app.coordinateSystem;
        curvedRoot_2026 = drawCategoryLabels(categories_2026,
            labelOptions_2026);
        var coordinateSystemAfterCurved_2026 = app.coordinateSystem;
        assertCategoryLabel(coordinateSystemBeforeCurved_2026 ===
            coordinateSystemAfterCurved_2026,
            "curved drawing should restore the coordinate system");

        labelOptions_2026.mode = "horizontal";
        labelOptions_2026.centerXmm = center_2026.x +
            Math.min(center_2026.widthMm, center_2026.heightMm) * 0.22;
        labelOptions_2026.textColor = [150, 45, 35];
        var coordinateSystemBeforeHorizontal_2026 = app.coordinateSystem;
        horizontalRoot_2026 = drawCategoryLabels(categories_2026,
            labelOptions_2026);
        var coordinateSystemAfterHorizontal_2026 = app.coordinateSystem;
        assertCategoryLabel(coordinateSystemBeforeHorizontal_2026 ===
            coordinateSystemAfterHorizontal_2026,
            "horizontal drawing should restore the coordinate system");
        restoreResult = (coordinateSystemBeforeCurved_2026 ===
            coordinateSystemAfterCurved_2026 &&
            coordinateSystemBeforeHorizontal_2026 ===
            coordinateSystemAfterHorizontal_2026) ? "yes" : "no";

        checkCategoryLabelSet(curvedRoot_2026, categories_2026, "curved",
            center_2026, radius_2026 + labelOptions_2026.radialOffsetMm);
        var horizontalCenter_2026 = {
            x: labelOptions_2026.centerXmm,
            y: center_2026.y
        };
        checkCategoryLabelSet(horizontalRoot_2026, categories_2026,
            "horizontal", horizontalCenter_2026,
            radius_2026 + labelOptions_2026.radialOffsetMm);
    } catch (caughtError) {
        testError = caughtError;
    } finally {
        app.coordinateSystem = previousCoordinateSystem;
    }

    if (testError) {
        throw testError;
    }

    alert("Category label test passed. Created 7 curved and 7 horizontal " +
        "editable category labels. Checked all quadrants, a 0-degree wrap, " +
        "an axis transition, unequal spans, content, centering, and text " +
        "editability. Coordinate system restored: " + restoreResult +
        ". Inspect the two label sets on the active artboard for reading " +
        "direction and text side.");
})();
