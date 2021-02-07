import arrayAlmostEqual from "array-almost-equal";

export function deduplicatedPath(polyline) {
  const points = [];
  let previous;
  for (let i = 0; i < polyline.length; i++) {
    const current = polyline[i];
    if (!previous || !arrayAlmostEqual(current, previous)) {
      points.push(current);
      previous = current;
    }
  }
  return points;
}
