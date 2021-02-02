const { mod, linspace, lerp, lerpArray } = require("canvas-sketch-util/math");
const arrayAlmostEqual = require("array-almost-equal");

const defined = require("defined");
const { vec2 } = require("gl-matrix");

module.exports = offsetPolyline;
function offsetPolyline(polyline, opts = {}) {
  const lineWidth = defined(opts.lineWidth, 1);
  const lineJoin = defined(opts.lineJoin, "miter"); // "bevel|round|miter"
  const lineCap = defined(opts.lineCap, "butt"); // "butt|round|square"
  const miterLimit = defined(opts.miterLimit, 10);
  const minCapRadius = defined(opts.minCapRadius, -Infinity);

  // TODO: Handle single-point case
  // TODO: Handle zero-point case

  const closed = Boolean(opts.closed);
  const points = cleanPolyline(polyline, opts);
  // if (points.length <= 2) throw new Error('not yet implented length <= 2');

  const edges = [
    { direction: -1, list: [] },
    { direction: 1, list: [] },
  ];

  if (closed) {
    for (let i = 0; i < points.length; i++) {
      const previous = points[mod(i - 1, points.length)];
      const current = points[i];
      const next = points[mod(i + 1, points.length)];
      segmentIterator(previous, current, next, i);
    }
  } else {
    for (let i = 0; i < points.length; i++) {
      const previous = i === 0 ? undefined : points[i - 1];
      const current = points[i];
      const next = i < points.length - 1 ? points[i + 1] : undefined;
      segmentIterator(previous, current, next, i);
    }
  }

  const edge0 = edges[0].list;
  const edge1 = edges[1].list.slice().reverse();
  return {
    contours: closed ? [edge0, edge1] : [edge0.concat(edge1)],
    vertices: edge0.concat(edge1),
    edges: edges.map((e) => e.list),
  };

  function segmentIterator(previousVertex, currentVertex, nextVertex, i) {
    const [previous] = fromVertex(previousVertex);
    const [current, currentLineWidth, currentScale] = fromVertex(currentVertex);
    const [next] = fromVertex(nextVertex);

    const result = getJoinTangent(previous, current, next);
    const { join, tangent, miterLength, clockwise } = result;

    let vertLineWidth =
      typeof currentLineWidth === "number" && isFinite(currentLineWidth)
        ? currentLineWidth
        : lineWidth;
    if (typeof currentScale === "number" && isFinite(currentScale)) {
      vertLineWidth *= currentScale;
    }

    const halfLineWidth = vertLineWidth / 2;

    let curLineJoin = lineJoin;

    // add start cap
    if (
      !previous &&
      !closed &&
      next &&
      lineCap === "round" &&
      halfLineWidth > minCapRadius
    ) {
      const len = vec2.distance(current, next);
      // if (halfLineWidth <= 0.5) console.log("LEN", len, halfLineWidth);
      const pts = getRoundCap(
        current,
        next,
        tangent,
        halfLineWidth,
        -1,
        clockwise
      );
      pts.forEach((p) => edges[0].list.push(p));
    }

    edges.forEach((e) => {
      const list = e.list;
      const direction = e.direction;
      const isBevelSide = clockwise ? direction > 0 : direction < 0;
      if (curLineJoin === "miter" && join && isBevelSide) {
        // const theta0 = Math.atan2(next[1] - previous[1], next[0] - previous[0]);
        // const theta1 = Math.atan2(current[1] - previous[1], current[0] - previous[0]);
        // const theta = theta0 - theta1;
        // const miterAngle = 1 / (Math.sin(theta / 2));
        // const miterRatio = (miterLength / vertLineWidth)
        if (miterLength > miterLimit) curLineJoin = "bevel";
      }

      const lineLen = direction * halfLineWidth;

      if (join) {
        if (isBevelSide) {
          const p0 = vec2.scaleAndAdd([], current, result.tangentAB, lineLen);
          const p1 = vec2.scaleAndAdd([], current, result.tangentBC, lineLen);

          if (curLineJoin === "bevel") {
            list.push(p0, p1);
          } else if (curLineJoin === "miter") {
            list.push(
              vec2.scaleAndAdd([], current, tangent, lineLen * miterLength)
            );
          } else if (curLineJoin === "round") {
            const pts = getRoundArc(
              undefined,
              current,
              p0,
              p1,
              next,
              clockwise
            );
            pts.forEach((p) => list.push(p));
          }
        } else {
          const lineA0 = vec2.scaleAndAdd(
            [],
            previous,
            result.tangentAB,
            lineLen
          );
          const lineA1 = vec2.scaleAndAdd(
            [],
            current,
            result.tangentAB,
            lineLen
          );

          const lineB0 = vec2.scaleAndAdd(
            [],
            current,
            result.tangentBC,
            lineLen
          );
          const lineB1 = vec2.scaleAndAdd([], next, result.tangentBC, lineLen);

          const hit = intersectLineSegmentLineSegment(
            lineA0,
            lineA1,
            lineB0,
            lineB1
          );
          if (hit >= 0 && hit <= 1) {
            list.push(lerpArray(lineA0, lineA1, hit));
          } else {
            // TODO: fixme, should select either tangentAB or tangentBC depending on orientation
            const outMid = vec2.scaleAndAdd([], current, tangent, lineLen);
            list.push(outMid);
          }
        }
      } else {
        const isCap = (!previous || !next) && !closed;
        if (isCap && lineCap === "square") {
          const normal = previous
            ? getNormal(previous, current)
            : getNormal(next, current);
          const curPoint = vec2.scaleAndAdd([], current, normal, halfLineWidth);
          const point = vec2.scaleAndAdd([], curPoint, tangent, lineLen);
          list.push(point);
        } else if (!isCap || (isCap && lineCap === "butt")) {
          const point = vec2.scaleAndAdd([], current, tangent, lineLen);
          list.push(point);
        }
      }
    });

    // add start cap
    if (
      !next &&
      !closed &&
      lineCap === "round" &&
      halfLineWidth > minCapRadius
    ) {
      const pts = getRoundCap(
        current,
        previous,
        tangent,
        halfLineWidth,
        1,
        clockwise
      );
      pts.forEach((p) => edges[0].list.push(p));
    }
  }
}

function getRoundCap(
  current,
  other,
  tangent,
  halfLineWidth,
  dir,
  clockwise,
  steps
) {
  // current = current.slice();
  // vec2.scaleAndAdd(current, current, [-tangent[1], tangent[0]], -2);
  const p0 = vec2.scaleAndAdd([], current, tangent, dir * -1 * halfLineWidth);
  const p1 = vec2.scaleAndAdd([], current, tangent, dir * +1 * halfLineWidth);
  const pMid = current;
  // if (halfLineWidth <= 0.5) {
  //   console.log(vec2.distance(p0, p1), vec2.distance(current, other));
  // }
  // const pMid = lerpArray(p0, p1, 0.5);
  // console.log(arrayAlmostEqual(pMid, current));
  const arc = getRoundArc(
    halfLineWidth,
    pMid,
    p0,
    p1,
    current,
    clockwise,
    steps
  );
  return arc;
}

function outerProduct(P, A, B) {
  return (P[0] - A[0]) * (B[1] - A[1]) - (P[1] - A[1]) * (B[0] - A[0]);
}

function fromVertex(item) {
  if (!item) return [undefined, undefined, undefined];
  if (Array.isArray(item)) {
    return [item, undefined, undefined];
  } else {
    return [item.position, item.lineWidth, item.scale];
  }
}

function getJoinTangent(previous, current, next) {
  if (!previous) {
    // First segment in open polyline
    // Take the normal from current to next
    const normal = getNormal(current, next);
    return {
      join: false,
      miterLength: 1,
      tangent: getTangentFromNormal(normal),
    };
  } else if (!next) {
    // Last segment in an open polyline
    // Take the normal from previous to current
    const normal = getNormal(previous, current);
    return {
      join: false,
      miterLength: 1,
      tangent: getTangentFromNormal(normal),
    };
  } else {
    // Some segment within the line, or within a closed polyline
    // Get the tangents for AB and BC
    const clockwise = signedArea(previous, current, next) <= 0;
    const normalAB = getNormal(previous, current);
    const normalBC = getNormal(current, next);
    const tangentAB = getTangentFromNormal(normalAB);
    const tangentBC = getTangentFromNormal(normalBC);
    const tangent = vec2.add([], tangentAB, tangentBC);
    vec2.normalize(tangent, tangent);

    const miter = vec2.set([], -tangent[1], tangent[0]);
    const tmp = vec2.set([], -tangentAB[1], tangentAB[0]);
    return {
      join: true,
      clockwise,
      normalAB,
      normalBC,
      tangentAB,
      tangentBC,
      miterLength: 1 / vec2.dot(miter, tmp),
      tangent,
    };
  }
}

function signedArea(p0, p1, p2) {
  return (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
}

function getTangentFromNormal(normal) {
  return vec2.set([], -normal[1], normal[0]);
}

function getNormal(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const result = [dx, dy];
  if (len2 !== 0) {
    const len = Math.sqrt(len2);
    result[0] /= len;
    result[1] /= len;
  }
  return result;
}

// if 'steps' is not specified, we'll just approximate it
function arcTo(x, y, radius, start, end, clockwise, steps, path) {
  if (!path) path = [];

  x = x || 0;
  y = y || 0;
  radius = radius || 0;
  start = start || 0;
  end = end || 0;

  // determine distance between the two angles
  // ...probably a nicer way of writing this
  var dist = Math.abs(start - end);
  if (!clockwise && start > end) {
    dist = 2 * Math.PI - dist;
  } else if (clockwise && end > start) {
    dist = 2 * Math.PI - dist;
  }

  // approximate the # of steps using the cube root of the radius
  if (typeof steps !== "number") {
    steps = Math.max(
      6,
      Math.floor(6 * Math.pow(radius, 1 / 3) * (dist / Math.PI))
    );
  }

  // ensure we have at least 3 steps..
  steps = Math.max(steps, 3);

  var f = dist / steps;
  var t = start;

  // modify direction
  f *= clockwise ? -1 : 1;

  for (var i = 0; i < steps + 1; i++) {
    var cs = Math.cos(t);
    var sn = Math.sin(t);

    var nx = x + cs * radius;
    var ny = y + sn * radius;

    path.push([nx, ny]);

    t += f;
  }
  return path;
}

function getRoundArc(radius, current, p0, p1, next, clockwise, steps) {
  const dist = vec2.distance(current, p0);
  radius = radius != null ? radius : dist;
  let angle0 = Math.atan2(p0[1] - current[1], p0[0] - current[0]);
  let angle1 = Math.atan2(p1[1] - current[1], p1[0] - current[0]);

  let originalAngle = angle0;
  const EPSILON = 1e-5;
  // calculate minimum angle between two given angles.
  // for example: -Math.PI, Math.PI = 0, -Math.PI/2, Math.PI= Math.PI/2, etc.
  if (angle1 > angle0) {
    while (angle1 - angle0 >= Math.PI - EPSILON) {
      angle1 = angle1 - 2 * Math.PI;
    }
  } else {
    while (angle0 - angle1 >= Math.PI - EPSILON) {
      angle0 = angle0 - 2 * Math.PI;
    }
  }

  let angleDiff = angle1 - angle0;

  // for angles equal Math.PI, make the round point in the right direction.
  if (
    Math.abs(angleDiff) >= Math.PI - EPSILON &&
    Math.abs(angleDiff) <= Math.PI + EPSILON
  ) {
    var r1 = vec2.sub([], current, next);
    if (r1.x === 0) {
      if (r1.y > 0) {
        angleDiff = -angleDiff;
      }
    } else if (r1.x >= -EPSILON) {
      angleDiff = -angleDiff;
    }
  }
  return arcTo(
    current[0],
    current[1],
    radius,
    originalAngle,
    originalAngle + angleDiff,
    clockwise,
    steps
  );
}

function cleanPolyline(polyline, opts = {}) {
  const points = [];
  let previous;
  for (let i = 0; i < polyline.length; i++) {
    const current = polyline[i];
    if (!previous || !arrayAlmostEqual(current, previous)) {
      points.push(current);
      previous = current;
    }
  }

  // For convenience, if the path is closed and the start and end
  // points are nearly identical, clean it up by popping off the last
  // point and re-closing it ourselves
  let autoClose = opts.autoClose !== false;
  if (
    autoClose &&
    opts.closed === true &&
    points.length >= 2 &&
    arrayAlmostEqual(points[0], points[points.length - 1])
  ) {
    points.pop();
  }
  return points;
}
function intersectLineSegmentLineSegment(p1, p2, p3, p4) {
  // Reference:
  // https://github.com/evil-mad/EggBot/blob/master/inkscape_driver/eggbot_hatch.py
  const d21x = p2[0] - p1[0];
  const d21y = p2[1] - p1[1];
  const d43x = p4[0] - p3[0];
  const d43y = p4[1] - p3[1];

  // denominator
  const d = d21x * d43y - d21y * d43x;
  if (d === 0) return -1;

  const nb = (p1[1] - p3[1]) * d21x - (p1[0] - p3[0]) * d21y;
  const sb = nb / d;
  if (sb < 0 || sb > 1) return -1;

  const na = (p1[1] - p3[1]) * d43x - (p1[0] - p3[0]) * d43y;
  const sa = na / d;
  if (sa < 0 || sa > 1) return -1;
  return sa;
}
