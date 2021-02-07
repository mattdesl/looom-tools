const simplifyPath = require("simplify-path");
const CatmullRomSpline = require("./catmull-rom-spline");
const math = require("canvas-sketch-util/math");

module.exports = processInputPath;
function processInputPath(input, closed = false) {
  if (input.length <= 3) return input.slice();

  const points = input.map((p) => p.position);
  const scale = input.map((p) => p.scale);
  // const scale = [];
  // let deltaTime = 1 / 60;
  // let lastValue = null;
  // const scalePower = 100;
  // for (let i = 0; i < input.length; i++) {
  //   let v = input[i].scale;
  //   v = v != null ? v : 1;
  //   if (lastValue != null) {
  //     const newValue = math.damp(lastValue, v, scalePower, deltaTime);
  //     scale.push(newValue);
  //     lastValue = newValue;
  //   } else {
  //     scale.push(v);
  //     lastValue = v;
  //   }
  // }

  const simplified = simplifyPath.radialDistance(points, 1);
  const spacing = 5;
  const spline = CatmullRomSpline(
    simplified.map((p, i, lst) => {
      const count = lst.length;
      const u = closed ? i / count : i / (count - 1);
      const scl = math.lerpFrames(scale, u);
      return [p[0], p[1], scl];
    }),
    {
      closed,
      type: "uniform",
      tension: 0.5,
      arcLengthDivisions: 200,
    }
  );

  const arclengths = spline.getArcLengths();
  const length = arclengths[arclengths.length - 1];
  const count = Math.max(2, Math.ceil(length / spacing));

  const resampled = [];
  const tmp = [0, 0, 0];
  let lastScale = null;

  for (let i = 0; i < count; i++) {
    const u = spline.closed ? i / count : i / (count - 1);
    const t = spline.getUtoTMapping(u, null, arclengths);
    spline.getPoint(t, tmp);

    const newScale = tmp[2];
    let curScale;
    if (lastScale != null) {
      curScale = math.damp(lastScale, newScale, 20, 1 / 60);
    } else {
      curScale = newScale;
    }
    lastScale = curScale;
    resampled.push({ position: [tmp[0], tmp[1]], scale: curScale });
  }
  return resampled;
}
