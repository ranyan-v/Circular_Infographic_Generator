(function runTextPositionCompatibilityTest_2026() {
    function errorMessageForTextPositionTest(error) {
        if (error && typeof error.message !== "undefined") {
            return String(error.message);
        }
        return String(error);
    }

    function positionTextForReport(position) {
        if (!position || position.length < 2) {
            return "unavailable";
        }
        return "[" + position[0] + ", " + position[1] + "] pt";
    }

    if (app.documents.length === 0) {
        alert("Open an Illustrator document with an artboard, then run this " +
            "compatibility test again.");
        return;
    }

    var previousCoordinateSystem = app.coordinateSystem;
    var report = [];
    var documentRef = app.activeDocument;
    var activeArtboard = documentRef.artboards[
        documentRef.artboards.getActiveArtboardIndex()
    ];
    var artboardBounds = activeArtboard.artboardRect;
    var artboardWidthPt = Math.abs(artboardBounds[2] - artboardBounds[0]);
    var artboardHeightPt = Math.abs(artboardBounds[1] - artboardBounds[3]);

    // With ARTBOARDCOORDINATESYSTEM and the default artboard ruler origin,
    // (0, 0) is the artboard's top-left; X increases right and Y becomes
    // more negative as positions move downward.
    // All target coordinates and position/translate values below are points.
    var positionTarget = [artboardWidthPt * 0.2, -artboardHeightPt * 0.25];
    var translateTarget = [artboardWidthPt * 0.62,
        -artboardHeightPt * 0.62];

    try {
        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;

        // Test 1: directly assign TextFrameItem.position.
        var positionFrame;
        try {
            positionFrame = documentRef.activeLayer.textFrames.add();
            positionFrame.name = "Position Assignment Test";
            positionFrame.contents = "POSITION assignment";
            positionFrame.textRange.characterAttributes.size = 12;
            positionFrame.position = positionTarget;

            var assignedPosition = positionFrame.position;
            report.push("position assignment: SUCCEEDED; target " +
                positionTextForReport(positionTarget) + "; read back " +
                positionTextForReport(assignedPosition));
        } catch (positionError) {
            var actualPosition = "unavailable";
            if (positionFrame) {
                try {
                    actualPosition = positionTextForReport(
                        positionFrame.position);
                } catch (positionReadError) {
                    actualPosition = "read failed: " +
                        errorMessageForTextPositionTest(positionReadError);
                }
            }
            report.push("position assignment: FAILED; " +
                errorMessageForTextPositionTest(positionError) +
                "; current position " + actualPosition);
        }

        // Test 2: use translate() on a separate text frame. Calculate a
        // delta from its current top-left position to a different artboard
        // coordinate, so this tests placement rather than a fixed movement.
        var translateFrame;
        try {
            translateFrame = documentRef.activeLayer.textFrames.add();
            translateFrame.name = "Translate Position Test";
            translateFrame.contents = "TRANSLATE movement";
            translateFrame.textRange.characterAttributes.size = 12;

            var initialPosition = translateFrame.position;
            var deltaX = translateTarget[0] - initialPosition[0];
            var deltaY = translateTarget[1] - initialPosition[1];
            translateFrame.translate(deltaX, deltaY);

            var translatedPosition = translateFrame.position;
            report.push("translate(): SUCCEEDED; target " +
                positionTextForReport(translateTarget) + "; initial " +
                positionTextForReport(initialPosition) + "; read back " +
                positionTextForReport(translatedPosition));
        } catch (translateError) {
            var currentTranslatedPosition = "unavailable";
            if (translateFrame) {
                try {
                    currentTranslatedPosition = positionTextForReport(
                        translateFrame.position);
                } catch (translateReadError) {
                    currentTranslatedPosition = "read failed: " +
                        errorMessageForTextPositionTest(translateReadError);
                }
            }
            report.push("translate(): FAILED; " +
                errorMessageForTextPositionTest(translateError) +
                "; current position " + currentTranslatedPosition);
        }
    } finally {
        app.coordinateSystem = previousCoordinateSystem;
    }

    alert("Point-text positioning compatibility test\n" +
        "Coordinate system during test: ARTBOARDCOORDINATESYSTEM\n" +
        "Convention: origin at artboard top-left; X right; downward Y is " +
        "negative; points\n\n" +
        report.join("\n\n") +
        "\n\nInspect the two labels at visibly different artboard positions.");
})();
