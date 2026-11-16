(function runGeometryTest_2026() {
#include "../src/geometry.jsx"
#include "../src/drawing.jsx"

function testAssert(condition, message) {
    if (!condition) {
        throw new Error("Test failed: " + message);
    }
}

function samePoint(a, b, tolerance) {
    return Math.abs(a[0] - b[0]) <= tolerance &&
        Math.abs(a[1] - b[1]) <= tolerance;
}

function checkRingSegmentStructure(sectorItem, sweepDegrees) {
    var arcSegments = Math.ceil(Math.abs(sweepDegrees) / 90);
    var expectedCount = arcSegments * 2 + 2;
    var pointCount = sectorItem.pathPoints.length;
    var tolerance = 0.0001;
    var i;

    testAssert(sectorItem.closed, "path should be closed");
    testAssert(sectorItem.filled, "path should be filled");
    testAssert(!sectorItem.stroked, "path should have no stroke");
    testAssert(pointCount === expectedCount,
        "unexpected anchor count: expected " + expectedCount +
        ", received " + pointCount);

    for (i = 0; i < pointCount; i++) {
        var current = sectorItem.pathPoints[i].anchor;
        var nextIndex = (i + 1) % pointCount;
        var next = sectorItem.pathPoints[nextIndex].anchor;
        testAssert(!samePoint(current, next, tolerance),
            "consecutive duplicate anchors at index " + i);
    }

    var cornerIndices = [0, arcSegments, arcSegments + 1, pointCount - 1];
    for (i = 0; i < cornerIndices.length; i++) {
        var cornerIndex = cornerIndices[i];
        var corner = sectorItem.pathPoints[cornerIndex];
        testAssert(corner.pointType === PointType.CORNER,
            "junction " + cornerIndex + " should be a corner point");
    }

    // The outer end and inner end close the first radial edge; the last inner
    // anchor and first outer anchor close the second. Their radial-side handles
    // must coincide with their anchors, which prevents curved radial edges.
    var radialStartOuter = sectorItem.pathPoints[arcSegments];
    var radialStartInner = sectorItem.pathPoints[arcSegments + 1];
    var radialEndInner = sectorItem.pathPoints[pointCount - 1];
    var radialEndOuter = sectorItem.pathPoints[0];
    testAssert(samePoint(radialStartOuter.anchor,
        radialStartOuter.rightDirection, tolerance),
        "first radial edge must leave outer corner with a coincident handle");
    testAssert(samePoint(radialStartInner.anchor,
        radialStartInner.leftDirection, tolerance),
        "first radial edge must enter inner corner with a coincident handle");
    testAssert(samePoint(radialEndInner.anchor,
        radialEndInner.rightDirection, tolerance),
        "second radial edge must leave inner corner with a coincident handle");
    testAssert(samePoint(radialEndOuter.anchor,
        radialEndOuter.leftDirection, tolerance),
        "second radial edge must enter outer corner with a coincident handle");

    for (i = 1; i < pointCount - 1; i++) {
        var isCorner = false;
        var j;
        for (j = 0; j < cornerIndices.length; j++) {
            if (i === cornerIndices[j]) {
                isCorner = true;
            }
        }
        if (!isCorner) {
            testAssert(sectorItem.pathPoints[i].pointType === PointType.SMOOTH,
                "intermediate arc point " + i + " should be smooth");
        }
    }
}

var testCases = [
    { name: "45 deg, small inner", start: -90, sweep: 45, inner: 4, color: [220, 45, 55] },
    { name: "120 deg, larger inner", start: -35, sweep: 120, inner: 13, color: [35, 145, 220] },
    { name: "220 deg, small inner", start: 45, sweep: 220, inner: 4, color: [35, 175, 105] },
    { name: "70 deg, larger inner", start: 160, sweep: 70, inner: 13, color: [235, 150, 35] },
    { name: "150 deg, small inner", start: 230, sweep: 150, inner: 6, color: [150, 75, 195] },
    { name: "260 deg, larger inner", start: 280, sweep: 260, inner: 13, color: [40, 175, 180] }
];

var doc = app.activeDocument;
var artboard = doc.artboards[
    doc.artboards.getActiveArtboardIndex()
];
var rect = artboard.artboardRect;
var artboardWidth = rect[2] - rect[0];
var artboardHeight = rect[1] - rect[3];
var outerRadius = 18; // millimeters
var centerX;
var centerY;
var row;
var column;
var caseIndex;

for (caseIndex = 0; caseIndex < testCases.length; caseIndex++) {
    row = Math.floor(caseIndex / 3);
    column = caseIndex % 3;
    centerX = rect[0] + artboardWidth * (column + 0.5) / 3;
    centerY = rect[1] - artboardHeight * (row + 0.5) / 2;

    var testCase = testCases[caseIndex];
    (function() {
        try {
            var returnedSectorItem_2026 = drawRingSegment(
                centerX,
                centerY,
                outerRadius,
                testCase.inner,
                testCase.start,
                testCase.start + testCase.sweep,
                testCase.color
            );
            checkRingSegmentStructure(
                returnedSectorItem_2026,
                testCase.sweep
            );
        } catch (experimentError_2026) {
            alert("IIFE caller-scope experiment failed for " +
                testCase.name + ":\n" + experimentError_2026);
            throw experimentError_2026;
        }
    })();
}

alert("Annular sector drawing and structural checks completed for " +
    testCases.length + " cases.");
})();
