/*
 * Isolated Illustrator PathItem return-value test.
 * Compatible with Adobe Illustrator 2020 ExtendScript.
 */

function testReturnPathItem_2026() {
    try {
        if (app.documents.length === 0) {
            throw new Error("Open or create a document before running this test.");
        }

        var activeDoc_2026 = app.activeDocument;
        var createdItem_2026 = activeDoc_2026.pathItems.add();

        createdItem_2026.setEntirePath([
            [100, 100],
            [160, 100],
            [160, 160],
            [100, 160]
        ]);
        createdItem_2026.closed = true;

        var insideTypeName_2026 = createdItem_2026.typename;
        var insidePointCount_2026 = createdItem_2026.pathPoints.length;

        alert("Inside testReturnPathItem_2026():" +
            "\ntypeof = " + typeof createdItem_2026 +
            "\ntypename = " + insideTypeName_2026 +
            "\npath point count = " + insidePointCount_2026);

        if (insideTypeName_2026 !== "PathItem") {
            throw new Error("The created object is not reported as a PathItem.");
        }
        if (insidePointCount_2026 !== 4) {
            throw new Error("Expected 4 path points; received " +
                insidePointCount_2026 + ".");
        }

        return createdItem_2026;
    } catch (functionError_2026) {
        throw new Error("testReturnPathItem_2026 failed: " + functionError_2026);
    }
}

(function runReturnValueTest_2026() {
    var returnedPathItem_2026;
    var resultLines_2026 = [];

    try {
        returnedPathItem_2026 = testReturnPathItem_2026();
        resultLines_2026.push("After the function returned:");
        resultLines_2026.push("undefined = " +
            (typeof returnedPathItem_2026 === "undefined"));
        resultLines_2026.push("null = " + (returnedPathItem_2026 === null));
        resultLines_2026.push("typeof = " + typeof returnedPathItem_2026);

        try {
            resultLines_2026.push("typename = " +
                returnedPathItem_2026.typename);
        } catch (typeReadError_2026) {
            resultLines_2026.push("typename access error = " +
                typeReadError_2026);
        }

        try {
            resultLines_2026.push("path point count = " +
                returnedPathItem_2026.pathPoints.length);
        } catch (pointsReadError_2026) {
            resultLines_2026.push("pathPoints.length access error = " +
                pointsReadError_2026);
        }

        alert(resultLines_2026.join("\n"));
    } catch (testError_2026) {
        alert("Return-value test error:\n" + testError_2026);
    }
})();
