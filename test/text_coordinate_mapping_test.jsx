(function runTextCoordinateMappingTest_2026() {
    function pointTextForCoordinateTest(point) {
        if (!point || point.length < 2) {
            return "unavailable";
        }
        return "[" + point[0] + ", " + point[1] + "] pt";
    }

    function rectTextForCoordinateTest(rect) {
        if (!rect || rect.length < 4) {
            return "unavailable";
        }
        return "[left=" + rect[0] + ", top=" + rect[1] +
            ", right=" + rect[2] + ", bottom=" + rect[3] + "] pt";
    }

    function coordinateErrorForTest(error) {
        if (error && typeof error.message !== "undefined") {
            return String(error.message);
        }
        return String(error);
    }

    function makeRgbForCoordinateTest(red, green, blue) {
        var color = new RGBColor();
        color.red = red;
        color.green = green;
        color.blue = blue;
        return color;
    }

    function addPointTextForCoordinateTest(documentRef, label, color) {
        var frame = documentRef.activeLayer.textFrames.add();
        frame.name = label;
        frame.contents = label;
        frame.textRange.characterAttributes.size = 16;
        frame.textRange.characterAttributes.fillColor = color;
        return frame;
    }

    if (app.documents.length === 0) {
        alert("Open an Illustrator document with an artboard before running " +
            "this coordinate mapping test.");
        return;
    }

    var documentRef = app.activeDocument;
    var previousCoordinateSystem = app.coordinateSystem;
    var report = [];
    var activeArtboard = documentRef.artboards[
        documentRef.artboards.getActiveArtboardIndex()
    ];
    var rectInDocumentCoordinates;
    var rectInArtboardCoordinates;
    var convertedTopLeft;
    var convertedBottomRight;
    var topLeftArtboardTarget;
    var centerArtboardTarget;
    var topLeftDocumentTarget;
    var topLeftFrame;
    var centerFrame;

    try {
        // Read artboard geometry and ruler origins with each coordinate mode
        // selected. Rect values are reported, not assumed to be artboard-local.
        app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        rectInDocumentCoordinates = activeArtboard.artboardRect;
        var documentRulerOrigin = documentRef.rulerOrigin;

        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
        rectInArtboardCoordinates = activeArtboard.artboardRect;
        var artboardRulerOrigin = activeArtboard.rulerOrigin;

        report.push("Current coordinate system before test: " +
            String(previousCoordinateSystem));
        report.push("Document rulerOrigin: " +
            pointTextForCoordinateTest(documentRulerOrigin));
        report.push("Active artboard rulerOrigin: " +
            pointTextForCoordinateTest(artboardRulerOrigin));
        report.push("artboardRect with DOCUMENT coordinates active: " +
            rectTextForCoordinateTest(rectInDocumentCoordinates));
        report.push("artboardRect with ARTBOARD coordinates active: " +
            rectTextForCoordinateTest(rectInArtboardCoordinates));

        // Convert the physical artboard corners from document to artboard
        // coordinates. This avoids treating artboardRect's position values as
        // local artboard coordinates without checking the origin.
        convertedTopLeft = documentRef.convertCoordinate(
            [rectInDocumentCoordinates[0], rectInDocumentCoordinates[1]],
            CoordinateSystem.DOCUMENTCOORDINATESYSTEM,
            CoordinateSystem.ARTBOARDCOORDINATESYSTEM
        );
        convertedBottomRight = documentRef.convertCoordinate(
            [rectInDocumentCoordinates[2], rectInDocumentCoordinates[3]],
            CoordinateSystem.DOCUMENTCOORDINATESYSTEM,
            CoordinateSystem.ARTBOARDCOORDINATESYSTEM
        );

        var artboardLeft = Math.min(convertedTopLeft[0],
            convertedBottomRight[0]);
        var artboardRight = Math.max(convertedTopLeft[0],
            convertedBottomRight[0]);
        // The verified ARTBOARD convention has Y = 0 at the top and negative
        // values downward. Thus the top is the larger Y and the bottom is
        // the smaller Y.
        var artboardTop = Math.max(convertedTopLeft[1],
            convertedBottomRight[1]);
        var artboardBottom = Math.min(convertedTopLeft[1],
            convertedBottomRight[1]);

        topLeftArtboardTarget = [artboardLeft + 36, artboardTop - 36];
        centerArtboardTarget = [
            (artboardLeft + artboardRight) / 2 - 55,
            (artboardTop + artboardBottom) / 2 + 10
        ];
        topLeftDocumentTarget = documentRef.convertCoordinate(
            topLeftArtboardTarget,
            CoordinateSystem.ARTBOARDCOORDINATESYSTEM,
            CoordinateSystem.DOCUMENTCOORDINATESYSTEM
        );

        report.push("Document top-left converted to artboard: " +
            pointTextForCoordinateTest(convertedTopLeft));
        report.push("Document bottom-right converted to artboard: " +
            pointTextForCoordinateTest(convertedBottomRight));
        report.push("Calculated artboard bounds in ARTBOARD coordinates: " +
            "[left=" + artboardLeft + ", top=" + artboardTop +
            ", right=" + artboardRight + ", bottom=" + artboardBottom +
            "] pt");
        report.push("Requested near-top-left artboard position: " +
            pointTextForCoordinateTest(topLeftArtboardTarget));
        report.push("That point converted to DOCUMENT coordinates: " +
            pointTextForCoordinateTest(topLeftDocumentTarget));
        report.push("Requested near-center artboard position: " +
            pointTextForCoordinateTest(centerArtboardTarget));

        // Label 1: artboard point converted to document coordinates, then
        // assigned while DOCUMENTCOORDINATESYSTEM is active.
        app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        try {
            topLeftFrame = addPointTextForCoordinateTest(documentRef,
                "TOP LEFT - converted", makeRgbForCoordinateTest(0, 110, 220));
            topLeftFrame.position = topLeftDocumentTarget;
            var topLeftReadbackDocument = topLeftFrame.position;
            var topLeftReadbackArtboard = documentRef.convertCoordinate(
                topLeftReadbackDocument,
                CoordinateSystem.DOCUMENTCOORDINATESYSTEM,
                CoordinateSystem.ARTBOARDCOORDINATESYSTEM
            );
            report.push("TOP LEFT label position assignment succeeded. " +
                "Requested DOCUMENT position: " +
                pointTextForCoordinateTest(topLeftDocumentTarget) +
                "; read back DOCUMENT position: " +
                pointTextForCoordinateTest(topLeftReadbackDocument) +
                "; converted read-back ARTBOARD position: " +
                pointTextForCoordinateTest(topLeftReadbackArtboard));
        } catch (topLeftError) {
            report.push("TOP LEFT label operation failed: " +
                coordinateErrorForTest(topLeftError));
        }

        // Label 2: a direct artboard-coordinate position near the center.
        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
        try {
            centerFrame = addPointTextForCoordinateTest(documentRef,
                "CENTER - artboard", makeRgbForCoordinateTest(210, 35, 120));
            centerFrame.position = centerArtboardTarget;
            var centerReadbackArtboard = centerFrame.position;
            var centerReadbackDocument = documentRef.convertCoordinate(
                centerReadbackArtboard,
                CoordinateSystem.ARTBOARDCOORDINATESYSTEM,
                CoordinateSystem.DOCUMENTCOORDINATESYSTEM
            );
            report.push("CENTER label position assignment succeeded. " +
                "Requested ARTBOARD position: " +
                pointTextForCoordinateTest(centerArtboardTarget) +
                "; read back ARTBOARD position: " +
                pointTextForCoordinateTest(centerReadbackArtboard) +
                "; converted read-back DOCUMENT position: " +
                pointTextForCoordinateTest(centerReadbackDocument));
        } catch (centerError) {
            report.push("CENTER label operation failed: " +
                coordinateErrorForTest(centerError));
        }
    } catch (coordinateSetupError) {
        report.push("Coordinate inspection failed: " +
            coordinateErrorForTest(coordinateSetupError));
    } finally {
        app.coordinateSystem = previousCoordinateSystem;
    }

    alert("Text coordinate mapping diagnostic\n" +
        "During the test: artboard coordinates use X right; downward Y " +
        "values become more negative; " +
        "all coordinates are points. Position is the text frame's bounding " +
        "box position.\n\n" + report.join("\n\n") +
        "\n\nVisual check: the blue label should be near the artboard's top " +
        "left, and the magenta label near its center.");
})();
