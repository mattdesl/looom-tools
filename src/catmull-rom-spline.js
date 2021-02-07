/**
 * Catmull-Rom spline utility taken from ThreeJS Curve.
 */
const catmullRomPointAt = require("./catmull-rom-point.js");
const euclideanDistance = require("euclidean-distance");

module.exports = CatmullRomSpline;
function CatmullRomSpline(points = [], opts = {}) {
  const {
    closed = false,
    type = "uniform",
    tension = 0.5,
    arcLengthDivisions = 200,
  } = opts;

  const spline = {
    closed,
    type,
    tension,
    points,
    arcLengthDivisions,
    getArcLengths,
    getLength,
    getPoints,
    getPoint,
    getSpacedPoint,
    getUtoTMapping,
  };

  return spline;

  function getLength() {
    const lengths = getArcLengths();
    return lengths.length === 0 ? 0 : lengths[lengths.length - 1];
  }

  function getPoints(n, spaced) {
    const arclengths = getArcLengths();
    const paths = [];
    for (let i = 0; i < n; i++) {
      const t = spline.closed ? i / n : i / (n - 1);
      const p = spaced ? getSpacedPoint(t, null, arclengths) : getPoint(t);
      paths.push(p);
    }
    return paths;
  }

  function getPoint(t, out) {
    return catmullRomPointAt(spline, t, out);
  }

  function getSpacedPoint(u, out, arcLengths) {
    let t = getUtoTMapping(u, null, arcLengths);
    return getPoint(t, out);
  }

  function getUtoTMapping(u, distance, arcLengths) {
    arcLengths = arcLengths || getArcLengths();

    var i = 0,
      il = arcLengths.length;

    var targetArcLength; // The targeted u distance value to get

    if (distance != null) {
      targetArcLength = distance;
    } else {
      targetArcLength = u * arcLengths[il - 1];
    }

    // binary search for the index with largest value smaller than target u distance

    var low = 0,
      high = il - 1,
      comparison;

    while (low <= high) {
      i = Math.floor(low + (high - low) / 2); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

      comparison = arcLengths[i] - targetArcLength;

      if (comparison < 0) {
        low = i + 1;
      } else if (comparison > 0) {
        high = i - 1;
      } else {
        high = i;
        break;

        // DONE
      }
    }

    i = high;

    if (arcLengths[i] === targetArcLength) {
      return i / (il - 1);
    }

    // we could get finer grain at lengths, or use simple interpolation between two points

    var lengthBefore = arcLengths[i];
    var lengthAfter = arcLengths[i + 1];

    var segmentLength = lengthAfter - lengthBefore;

    // determine where we are between the 'before' and 'after' points

    var segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

    // add that fractional amount to t

    var t = (i + segmentFraction) / (il - 1);

    return t;
  }

  function getArcLengths(divisions) {
    divisions = divisions || spline.arcLengthDivisions;
    var out = [];
    var current;
    var last = getPoint(0);
    var p;
    var sum = 0;

    out.push(0);

    for (p = 1; p <= divisions; p++) {
      current = getPoint(p / divisions);
      sum += euclideanDistance(current, last);
      out.push(sum);
      last = current;
    }

    return out;
  }
}
