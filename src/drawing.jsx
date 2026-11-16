/*
 * Circular Infographic Generator
 * Drawing Engine - Annular Sector
 *
 * Developer: ran.yan
 * Email: ran.yan.v@outlook.com
 */

// Convert a length in millimeters to Illustrator points.
function mmToPt(mm) {
    return mm * 72 / 25.4;
}


// Calculate a point on a circle. Center coordinates and radius are in points;
// angle is in degrees. Positive angles move counterclockwise on the page.
function getCirclePoint(cx, cy, radius, angle) {
    var radians = angle * Math.PI / 180;

    return [
        cx + radius * Math.cos(radians),
        cy - radius * Math.sin(radians)
    ];
}


// Add a circular arc to the anchor-point list. Center and radius are in points;
// angles are in degrees. Reuse an existing first anchor when it coincides with
// the arc start, preserving the preceding segment's incoming handle.
function addBezierArc(
    points,
    cx,
    cy,
    radius,
    startAngle,
    endAngle
) {
    var angleRange = endAngle - startAngle;
    var segments = Math.ceil(Math.abs(angleRange) / 90);
    var delta = angleRange / segments;
    var k = (4 / 3) * Math.tan(delta * Math.PI / 720);

    for (var i = 0; i < segments; i++) {
        var a0 = startAngle + i * delta;
        var a1 = a0 + delta;

        var p0 = getCirclePoint(cx, cy, radius, a0);
        var p1 = getCirclePoint(cx, cy, radius, a1);

        var r0 = a0 * Math.PI / 180;
        var r1 = a1 * Math.PI / 180;

        var tangent0 = [-Math.sin(r0), -Math.cos(r0)];
        var tangent1 = [-Math.sin(r1), -Math.cos(r1)];

        var outHandle = [
            p0[0] + k * radius * tangent0[0],
            p0[1] + k * radius * tangent0[1]
        ];
        var inHandle = [
            p1[0] - k * radius * tangent1[0],
            p1[1] - k * radius * tangent1[1]
        ];

        if (i === 0 && points.length > 0 &&
            points[points.length - 1].anchor[0] === p0[0] &&
            points[points.length - 1].anchor[1] === p0[1]) {
            points[points.length - 1].right = outHandle;
        } else if (i === 0) {
            points.push({
                anchor: p0,
                left: p0,
                right: outHandle
            });
        } else {
            points[points.length - 1].right = outHandle;
        }

        points.push({
            anchor: p1,
            left: inHandle,
            right: p1
        });
    }

    return segments;
}


// Draw a closed ring segment. centerX and centerY are Illustrator points;
// outerRadius and innerRadius are millimeters; angles are degrees; color is
// an RGB triplet with channel values from 0 to 255.
function drawRingSegment(
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    startAngle,
    endAngle,
    color
) {
    if (outerRadius <= innerRadius || innerRadius <= 0) {
        throw new Error("Invalid ring radius.");
    }

    if (endAngle <= startAngle) {
        throw new Error("Invalid arc angles.");
    }

    var doc = app.activeDocument;
    var cx = centerX;
    var cy = centerY;
    var outer = mmToPt(outerRadius);
    var inner = mmToPt(innerRadius);
    var points = [];

    // 1. Outer circular arc.
    var segments = addBezierArc(
        points,
        cx,
        cy,
        outer,
        startAngle,
        endAngle
    );

    // 2. First radial edge. Coincident handles make this segment straight.
    var innerEnd = getCirclePoint(cx, cy, inner, endAngle);
    points[points.length - 1].right = points[points.length - 1].anchor;
    points.push({
        anchor: innerEnd,
        left: innerEnd,
        right: innerEnd
    });

    // 3. Inner circular arc, traversed in reverse. Its first anchor reuses
    // innerEnd, so there is no duplicate point at the radial/arc junction.
    addBezierArc(points, cx, cy, inner, endAngle, startAngle);

    // 4. Second radial edge is supplied by closing the path. Keep its handles
    // coincident at both ends so it cannot curve away from the radius.
    points[points.length - 1].right = points[points.length - 1].anchor;
    points[0].left = points[0].anchor;

    // Build the anchor array with an indexed loop for ExtendScript compatibility.
    var anchors = [];
    for (var anchorIndex = 0; anchorIndex < points.length; anchorIndex++) {
        anchors.push(points[anchorIndex].anchor);
    }

    var path = doc.pathItems.add();
    path.setEntirePath(anchors);

    // Four arc/radial junctions are corners; all intervening arc points are
    // smooth. Apply point types before directions to preserve our exact handles.
    for (var i = 0; i < points.length; i++) {
        var pathPoint = path.pathPoints[i];
        if (i === 0 || i === segments ||
            i === segments + 1 || i === points.length - 1) {
            pathPoint.pointType = PointType.CORNER;
        } else {
            pathPoint.pointType = PointType.SMOOTH;
        }
        pathPoint.leftDirection = points[i].left;
        pathPoint.rightDirection = points[i].right;
    }

    var fill = new RGBColor();
    fill.red = color[0];
    fill.green = color[1];
    fill.blue = color[2];

    path.closed = true;
    path.filled = true;
    path.fillColor = fill;
    path.stroked = false;

    return path;
}
