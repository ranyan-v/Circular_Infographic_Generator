(function runItemDrawingTests_2026() {
#include "../src/item_layout.jsx"
#include "../src/item_drawing.jsx"

    function assertItemDrawing(condition, message) {
        if (!condition) {
            throw new Error("Item drawing test failed: " + message);
        }
    }

    function createItemDrawingCenterMm(documentRef, artboardBounds) {
        var artboardTopLeft = documentRef.convertCoordinate(
            [artboardBounds[0], artboardBounds[1]],
            CoordinateSystem.DOCUMENTCOORDINATESYSTEM,
            CoordinateSystem.ARTBOARDCOORDINATESYSTEM
        );
        var artboardBottomRight = documentRef.convertCoordinate(
            [artboardBounds[2], artboardBounds[3]],
            CoordinateSystem.DOCUMENTCOORDINATESYSTEM,
            CoordinateSystem.ARTBOARDCOORDINATESYSTEM
        );
        var left = Math.min(artboardTopLeft[0], artboardBottomRight[0]);
        var right = Math.max(artboardTopLeft[0], artboardBottomRight[0]);
        // Verified artboard coordinates use Y=0 at the top and negative Y
        // values downward, so top is the larger coordinate.
        var top = Math.max(artboardTopLeft[1], artboardBottomRight[1]);
        var bottom = Math.min(artboardTopLeft[1], artboardBottomRight[1]);
        var pointsToMm = 25.4 / 72;
        return {
            x: ((left + right) / 2) * pointsToMm,
            y: ((top + bottom) / 2) * pointsToMm
        };
    }

    function assertItemDrawingNear(actual, expected, message) {
        var tolerancePt = 0.1;
        assertItemDrawing(Math.abs(actual - expected) <= tolerancePt,
            message + "; expected " + expected + " pt, received " + actual +
            " pt");
    }

    function findItemDrawingGroupByName(collection, expectedName) {
        var index;
        for (index = 0; index < collection.length; index++) {
            if (collection[index].name === expectedName) {
                return collection[index];
            }
        }
        return null;
    }

    function checkItemDrawingStructure(root, expectedCategoryCount,
        expectedItemCounts, layout, appearance) {
        assertItemDrawing(root && root.typename === "GroupItem",
            "drawing function should return the Items root group");
        assertItemDrawing(root.groupItems.length === expectedCategoryCount,
            "root should contain one group per category");

        var categoryIndex;
        var itemIndex;
        for (categoryIndex = 0; categoryIndex < expectedCategoryCount;
            categoryIndex++) {
            var layoutCategory = layout[categoryIndex];
            var categoryGroupName = "Category " +
                String(layoutCategory.categoryIndex) + " - " +
                layoutCategory.name;
            var categoryGroup = findItemDrawingGroupByName(root.groupItems,
                categoryGroupName);
            assertItemDrawing(categoryGroup !== null,
                "category identity should be preserved in its group name");
            assertItemDrawing(categoryGroup.typename === "GroupItem",
                "category container should be a GroupItem");
            assertItemDrawing(categoryGroup.groupItems.length ===
                expectedItemCounts[categoryIndex],
                "category should contain the expected item groups");

            for (itemIndex = 0;
                itemIndex < expectedItemCounts[categoryIndex]; itemIndex++) {
                var layoutItem = layoutCategory.items[itemIndex];
                var itemGroupName = "Item " + String(layoutItem.itemIndex) +
                    " - " + layoutItem.name;
                var itemGroup = findItemDrawingGroupByName(
                    categoryGroup.groupItems, itemGroupName);
                assertItemDrawing(itemGroup !== null,
                    "item identity should be preserved in its group name");
                assertItemDrawing(itemGroup.typename === "GroupItem",
                    "each item should have its own GroupItem");
                assertItemDrawing(itemGroup.pathItems.length === 1,
                    "each item group should contain one icon path");
                assertItemDrawing(itemGroup.textFrames.length === 1,
                    "each item group should contain one text frame");
                assertItemDrawing(itemGroup.pathItems[0].typename === "PathItem",
                    "icon placeholder should be a native PathItem");
                assertItemDrawing(itemGroup.textFrames[0].typename ===
                    "TextFrame",
                    "text label should be an editable Illustrator text frame");

                var iconPath = itemGroup.pathItems[0];
                var labelFrame = itemGroup.textFrames[0];
                var pointsPerMm = 72 / 25.4;
                var iconDiameterPt = appearance.iconDiameterMm * pointsPerMm;
                var iconCenterXPt = layoutItem.xMm * pointsPerMm;
                var iconCenterYPt = layoutItem.yMm * pointsPerMm;
                var iconBounds = iconPath.geometricBounds;

                assertItemDrawing(labelFrame.contents === layoutItem.name,
                    "text content should preserve item identity");
                assertItemDrawingNear(iconBounds[0],
                    iconCenterXPt - iconDiameterPt / 2,
                    "icon left should match calculated item X");
                assertItemDrawingNear(iconBounds[1],
                    iconCenterYPt + iconDiameterPt / 2,
                    "icon top should match calculated item Y");
                assertItemDrawingNear(iconBounds[2],
                    iconCenterXPt + iconDiameterPt / 2,
                    "icon right should match calculated item X");
                assertItemDrawingNear(iconBounds[3],
                    iconCenterYPt - iconDiameterPt / 2,
                    "icon bottom should match calculated item Y");

                var labelPosition = labelFrame.position;
                var labelWidthPt = labelFrame.width;
                var labelHeightPt = labelFrame.height;
                var textOffsetPt = appearance.textOffsetMm * pointsPerMm;
                var expectedLabelLeft;
                if (layoutItem.side === "right") {
                    expectedLabelLeft = iconCenterXPt + iconDiameterPt / 2 +
                        textOffsetPt;
                } else {
                    expectedLabelLeft = iconCenterXPt - iconDiameterPt / 2 -
                        textOffsetPt - labelWidthPt;
                }
                var expectedLabelTop = iconCenterYPt + labelHeightPt / 2;
                assertItemDrawingNear(labelPosition[0], expectedLabelLeft,
                    "label should have the expected left/right offset");
                assertItemDrawingNear(labelPosition[1], expectedLabelTop,
                    "label vertical center should match its icon center");
                assertItemDrawingNear(
                    labelFrame.textRange.characterAttributes.size,
                    appearance.fontSizePt,
                    "label should keep the configured font size");
                var expectedJustification = (layoutItem.side === "right") ?
                    Justification.LEFT : Justification.RIGHT;
                assertItemDrawing(
                    labelFrame.textRange.paragraphAttributes.justification ===
                        expectedJustification,
                    "label justification should match its left/right side");
            }
        }
    }

    if (app.documents.length === 0) {
        throw new Error("Open a document with a visible artboard before " +
            "running the item drawing test.");
    }

    var previousCoordinateSystem = app.coordinateSystem;
    var rootGroup_2026;
    var testError;
    try {
        app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        var activeDocument_2026 = app.activeDocument;
        var artboardBounds_2026 = activeDocument_2026.artboards[
            activeDocument_2026.artboards.getActiveArtboardIndex()
        ].artboardRect;
        var center_2026 = createItemDrawingCenterMm(activeDocument_2026,
            artboardBounds_2026);

        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;

        var sourceCategories_2026 = [
            {
                categoryIndex: 1,
                name: "Right Side",
                startAngle: 300,
                endAngle: 420,
                items: [
                    { itemIndex: 1, name: "North East", manualAngle: 325 },
                    { itemIndex: 2, name: "East", manualAngle: 0 },
                    { itemIndex: 3, name: "South East", manualAngle: 35 }
                ]
            },
            {
                categoryIndex: 2,
                name: "Left Side",
                startAngle: 120,
                endAngle: 240,
                items: [
                    { itemIndex: 1, name: "North West", manualAngle: 215 },
                    { itemIndex: 2, name: "West", manualAngle: 180 },
                    { itemIndex: 3, name: "South West", manualAngle: 145 }
                ]
            }
        ];
        var layout_2026 = calculateItemLayout(sourceCategories_2026, {
            centerXmm: center_2026.x,
            centerYmm: center_2026.y,
            itemRadiusMm: 48,
            itemGapDegrees: 4
        });

        var appearance_2026 = {
            iconDiameterMm: 11,
            iconStrokeWidthMm: 0.6,
            iconStrokeColor: [35, 74, 120],
            iconFillColor: [214, 232, 250],
            textColor: [30, 45, 65],
            fontSizePt: 12,
            textOffsetMm: 3
        };
        // Layout coordinates are artboard-based. Call the renderer while the
        // app is in document mode to verify it restores the caller's setting.
        app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        var coordinateSystemBeforeDraw_2026 = app.coordinateSystem;
        rootGroup_2026 = drawItemLayouts(layout_2026, appearance_2026);
        assertItemDrawing(app.coordinateSystem === coordinateSystemBeforeDraw_2026,
            "drawing function should restore the caller's coordinate system");

        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
        checkItemDrawingStructure(rootGroup_2026, 2, [3, 3], layout_2026,
            appearance_2026);
    } catch (caughtError) {
        testError = caughtError;
    } finally {
        app.coordinateSystem = previousCoordinateSystem;
    }

    if (testError) {
        throw testError;
    }

    alert("Item drawing test completed. Created 2 category groups and 6 " +
        "item groups with editable icon paths and text labels. Inspect the " +
        "active artboard for left/right placement and horizontal labels.");
})();
