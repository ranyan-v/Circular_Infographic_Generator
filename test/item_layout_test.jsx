(function runItemLayoutTests_2026() {
#include "../src/item_layout.jsx"

function assertItemLayout(condition, message) {
    if (!condition) {
        throw new Error("Test failed: " + message);
    }
}

function assertNear(actual, expected, tolerance, message) {
    assertItemLayout(Math.abs(actual - expected) <= tolerance,
        message + "; expected " + expected + ", received " + actual);
}

function expectItemLayoutError(callback, message) {
    var didThrow = false;
    try {
        callback();
    } catch (expectedError) {
        didThrow = true;
    }
    assertItemLayout(didThrow, message);
}

function createTestItems(count) {
    var items = [];
    var i;
    for (i = 0; i < count; i++) {
        items.push({
            itemIndex: i,
            name: "Item " + i
        });
    }
    return items;
}

function createTestCategory(index, name, start, end, items) {
    return {
        categoryIndex: index,
        name: name,
        startAngle: start,
        endAngle: end,
        items: items
    };
}

function createTestOptions(radius, gap, centerX, centerY) {
    return {
        centerXmm: centerX,
        centerYmm: centerY,
        itemRadiusMm: radius,
        itemGapDegrees: gap
    };
}

function snapshotTestCategories(categories) {
    var values = [];
    var i;
    var j;
    for (i = 0; i < categories.length; i++) {
        values.push(categories[i].categoryIndex);
        values.push(categories[i].name);
        values.push(categories[i].startAngle);
        values.push(categories[i].endAngle);
        for (j = 0; j < categories[i].items.length; j++) {
            values.push(categories[i].items[j].itemIndex);
            values.push(categories[i].items[j].name);
            values.push(String(categories[i].items[j].manualAngle));
        }
    }
    return values.join("|");
}

var testCount_2026 = 0;

// 1. One item is centered in its category; Item Gap has no effect.
var oneItemCategory = createTestCategory(10, "Single", 20, 80,
    createTestItems(1));
var oneItemResult = calculateItemLayout(
    [oneItemCategory], createTestOptions(10, 45, 0, 0));
assertNear(oneItemResult[0].items[0].angle, 50, 0.000001,
    "single item should use category midpoint");
assertItemLayout(!oneItemResult[0].items[0].isManual,
    "automatic item should be marked non-manual");
testCount_2026++;

// 2. Multiple items with zero gap are centered in equal intervals.
var zeroGapCategory = createTestCategory(11, "Zero Gap", 0, 120,
    createTestItems(4));
var zeroGapResult = calculateItemLayout(
    [zeroGapCategory], createTestOptions(12, 0, 0, 0));
var expectedZeroGapAngles = [15, 45, 75, 105];
var testIndex;
for (testIndex = 0; testIndex < expectedZeroGapAngles.length; testIndex++) {
    assertNear(zeroGapResult[0].items[testIndex].angle,
        expectedZeroGapAngles[testIndex], 0.000001,
        "zero-gap item angle " + testIndex);
}
testCount_2026++;

// 3. A 10-degree Item Gap reserves one internal gap for two items.
var itemGapCategory = createTestCategory(12, "Item Gap", 0, 100,
    createTestItems(2));
var itemGapResult = calculateItemLayout(
    [itemGapCategory], createTestOptions(10, 10, 0, 0));
assertNear(itemGapResult[0].items[0].angle, 22.5, 0.000001,
    "first item with nonzero gap");
assertNear(itemGapResult[0].items[1].angle, 77.5, 0.000001,
    "second item with nonzero gap");
testCount_2026++;

// 4 and 5. Different item counts and a separate category gap remain intact.
var twoItemCategory = createTestCategory(13, "Two", 0, 80,
    createTestItems(2));
var threeItemCategory = createTestCategory(14, "Three", 90, 180,
    createTestItems(3));
var categoriesWithCategoryGap = [twoItemCategory, threeItemCategory];
var categoryGapResult = calculateItemLayout(
    categoriesWithCategoryGap, createTestOptions(8, 10, 0, 0));
assertNear(categoryGapResult[0].items[0].angle, 17.5, 0.000001,
    "two-item category first angle");
assertNear(categoryGapResult[0].items[1].angle, 62.5, 0.000001,
    "two-item category second angle");
assertNear(categoryGapResult[1].items[0].angle, 101.6666666667, 0.000001,
    "three-item category first angle");
assertNear(categoryGapResult[1].items[2].angle, 168.3333333333, 0.000001,
    "three-item category final angle");
assertNear(categoryGapResult[0].endAngle, 80, 0,
    "first category end must remain unchanged");
assertNear(categoryGapResult[1].startAngle, 90, 0,
    "second category start must remain unchanged");
assertItemLayout(categoryGapResult[0].items[1].angle < 80 &&
    categoryGapResult[1].items[0].angle > 90,
    "no item should be placed in the category gap");
testCount_2026++;

// 6 and 7. A valid manual angle replaces only its own automatic slot.
var automaticManualTestCategory = createTestCategory(15, "Manual", 0, 100,
    createTestItems(3));
var automaticManualBaseline = calculateItemLayout(
    [automaticManualTestCategory], createTestOptions(10, 0, 0, 0));
var manualTestCategory = createTestCategory(15, "Manual", 0, 100,
    [
        { itemIndex: 0, name: "Item 0" },
        { itemIndex: 1, name: "Item 1", manualAngle: 70 },
        { itemIndex: 2, name: "Item 2" }
    ]);
var manualResult = calculateItemLayout(
    [manualTestCategory], createTestOptions(10, 0, 0, 0));
assertNear(manualResult[0].items[1].angle, 70, 0,
    "manual angle should override its automatic slot");
assertItemLayout(manualResult[0].items[1].isManual,
    "manual item should be marked manual");
assertNear(manualResult[0].items[0].angle,
    automaticManualBaseline[0].items[0].angle, 0,
    "manual override must not move earlier automatic item");
assertNear(manualResult[0].items[2].angle,
    automaticManualBaseline[0].items[2].angle, 0,
    "manual override must not move later automatic item");
assertNear(manualResult[0].startAngle,
    automaticManualBaseline[0].startAngle, 0,
    "manual override must not change category start");
assertNear(manualResult[0].endAngle,
    automaticManualBaseline[0].endAngle, 0,
    "manual override must not change category end");
testCount_2026++;

// 8 and 9. Category boundaries and outside angles are rejected.
expectItemLayoutError(function() {
    var boundaryStartCategory = createTestCategory(16, "Boundary Start", 0, 100,
        [{ itemIndex: 0, name: "Edge", manualAngle: 0 }]);
    calculateItemLayout([boundaryStartCategory], createTestOptions(5, 0, 0, 0));
}, "manual angle at category start must be rejected");
expectItemLayoutError(function() {
    var boundaryEndCategory = createTestCategory(17, "Boundary End", 0, 100,
        [{ itemIndex: 0, name: "Edge", manualAngle: 100 }]);
    calculateItemLayout([boundaryEndCategory], createTestOptions(5, 0, 0, 0));
}, "manual angle at category end must be rejected");
expectItemLayoutError(function() {
    var outsideCategory = createTestCategory(18, "Outside", 0, 100,
        [{ itemIndex: 0, name: "Outside", manualAngle: 101 }]);
    calculateItemLayout([outsideCategory], createTestOptions(5, 0, 0, 0));
}, "manual angle outside category must be rejected");
testCount_2026++;

// 10. A category crossing 0 degrees accepts an equivalent manual angle.
var wrapCategory = createTestCategory(19, "Wrap", 350, 410,
    [{ itemIndex: 0, name: "Across Zero", manualAngle: 5 }]);
var wrapResult = calculateItemLayout(
    [wrapCategory], createTestOptions(7, 0, 0, 0));
assertNear(wrapResult[0].items[0].angle, 5, 0,
    "manual angle should retain its supplied value");
assertItemLayout(wrapResult[0].items[0].isManual,
    "wrapped manual item should be marked manual");
testCount_2026++;

// 11 and 12. Negative and excessive Item Gaps are rejected.
expectItemLayoutError(function() {
    calculateItemLayout([itemGapCategory], createTestOptions(5, -1, 0, 0));
}, "negative Item Gap must be rejected");
var excessiveGapCategory = createTestCategory(20, "Excessive Gap", 0, 20,
    createTestItems(3));
expectItemLayoutError(function() {
    calculateItemLayout([excessiveGapCategory],
        createTestOptions(5, 10, 0, 0));
}, "Item Gap leaving no positive-width intervals must be rejected");
testCount_2026++;

// 13. Invalid and non-finite values are rejected.
expectItemLayoutError(function() {
    calculateItemLayout([oneItemCategory], createTestOptions(5, 0 / 0, 0, 0));
}, "NaN Item Gap must be rejected");
expectItemLayoutError(function() {
    calculateItemLayout([oneItemCategory], createTestOptions(1 / 0, 0, 0, 0));
}, "infinite Item Radius must be rejected");
expectItemLayoutError(function() {
    calculateItemLayout([oneItemCategory], createTestOptions(-1, 0, 0, 0));
}, "negative Item Radius must be rejected");
expectItemLayoutError(function() {
    calculateItemLayout([oneItemCategory], createTestOptions(5, 0, 0 / 0, 0));
}, "NaN center coordinate must be rejected");
expectItemLayoutError(function() {
    var invalidRangeCategory = createTestCategory(21, "Invalid Range", 0,
        1 / 0, createTestItems(1));
    calculateItemLayout([invalidRangeCategory], createTestOptions(5, 0, 0, 0));
}, "infinite category boundary must be rejected");
expectItemLayoutError(function() {
    var invalidManualCategory = createTestCategory(22, "Invalid Manual", 0, 100,
        [{ itemIndex: 0, name: "NaN Manual", manualAngle: 0 / 0 }]);
    calculateItemLayout([invalidManualCategory], createTestOptions(5, 0, 0, 0));
}, "NaN manual angle must be rejected");
testCount_2026++;

// 14 and 15. Cardinal coordinate values and the vertical-axis side rule.
var cardinalCategory = createTestCategory(23, "Cardinal", -1, 359,
    [
        { itemIndex: 0, name: "Right", manualAngle: 0 },
        { itemIndex: 1, name: "Up", manualAngle: 90 },
        { itemIndex: 2, name: "Left", manualAngle: 180 },
        { itemIndex: 3, name: "Down", manualAngle: 270 }
    ]);
var cardinalResult = calculateItemLayout(
    [cardinalCategory], createTestOptions(5, 0, 10, 20));
var cardinalItems = cardinalResult[0].items;
assertNear(cardinalItems[0].xMm, 15, 0.000001, "0-degree X");
assertNear(cardinalItems[0].yMm, 20, 0.000001, "0-degree Y");
assertNear(cardinalItems[1].xMm, 10, 0.000001, "90-degree X");
assertNear(cardinalItems[1].yMm, 15, 0.000001, "90-degree Y");
assertNear(cardinalItems[2].xMm, 5, 0.000001, "180-degree X");
assertNear(cardinalItems[2].yMm, 20, 0.000001, "180-degree Y");
assertNear(cardinalItems[3].xMm, 10, 0.000001, "270-degree X");
assertNear(cardinalItems[3].yMm, 25, 0.000001, "270-degree Y");
assertItemLayout(cardinalItems[0].side === "right" &&
    cardinalItems[1].side === "right" &&
    cardinalItems[2].side === "left" &&
    cardinalItems[3].side === "right",
    "left/right classification including vertical-axis rule");
assertItemLayout(cardinalItems[0].radialDistanceMm === 5,
    "output should preserve radial distance");
assertItemLayout(cardinalResult[0].categoryIndex === 23 &&
    cardinalItems[2].categoryIndex === 23 &&
    cardinalItems[2].itemIndex === 2 &&
    cardinalItems[2].name === "Left",
    "category and item identity should be preserved");
testCount_2026++;

// 16. Different radial distances scale coordinates without changing angles.
var radiusCategory = createTestCategory(24, "Radius", -10, 10,
    createTestItems(1));
var smallRadiusResult = calculateItemLayout(
    [radiusCategory], createTestOptions(2, 0, 10, 20));
var largeRadiusResult = calculateItemLayout(
    [radiusCategory], createTestOptions(20, 0, 10, 20));
assertNear(smallRadiusResult[0].items[0].xMm, 12, 0.000001,
    "small radius coordinate");
assertNear(largeRadiusResult[0].items[0].xMm, 30, 0.000001,
    "large radius coordinate");
assertNear(smallRadiusResult[0].items[0].angle,
    largeRadiusResult[0].items[0].angle, 0,
    "radial distance must not change angle");
testCount_2026++;

// 17. Input category and item data are not mutated.
var immutableCategories = [createTestCategory(25, "Immutable", 0, 120,
    [
        { itemIndex: 0, name: "Fixed", manualAngle: 70 },
        { itemIndex: 1, name: "Automatic" }
    ])];
var beforeSnapshot = snapshotTestCategories(immutableCategories);
calculateItemLayout(immutableCategories, createTestOptions(9, 5, 3, 4));
var afterSnapshot = snapshotTestCategories(immutableCategories);
assertItemLayout(beforeSnapshot === afterSnapshot,
    "original category and item data must remain unchanged");
testCount_2026++;

// Basic malformed-input cases.
expectItemLayoutError(function() {
    calculateItemLayout([], createTestOptions(5, 0, 0, 0));
}, "empty category array must be rejected");
expectItemLayoutError(function() {
    calculateItemLayout([createTestCategory(26, "Empty", 0, 100, [])],
        createTestOptions(5, 0, 0, 0));
}, "category without items must be rejected");
expectItemLayoutError(function() {
    var zeroRangeCategory = createTestCategory(27, "Zero Range", 10, 10,
        createTestItems(1));
    calculateItemLayout([zeroRangeCategory], createTestOptions(5, 0, 0, 0));
}, "zero-width category must be rejected");

alert("Item layout tests passed. Test groups completed: " + testCount_2026 +
    ".");
})();
