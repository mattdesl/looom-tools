const processInputPath = require("./util/process-input");
const offsetPath = require("./util/offset-path");

const defaultMathRandom = () => Math.random();

module.exports.getFrameIndex = getFrameIndex;
function getFrameIndex(thread, time, random = defaultMathRandom) {
  const {
    speed = 12,
    latched = false,
    timeOffset = 0,
    playMode = 0,
  } = thread.options;
  if (playMode === 3) return Math.floor(random() * thread.frames.length);

  const intervalMS = 1 / speed * 1000;
  const timeMS = Math.round((time * 1000) / intervalMS) * intervalMS;


  const duration = thread.frames.length / speed;
  const N = thread.frames.length;
  const elapsed = latched ? 0 : (timeMS / 1000) + (timeOffset / 1000);

  let playDirection;
  if (playMode === 0 || playMode === 1) {
    playDirection = playMode === 0 ? 1 : -1;
  } else {
    const cur = wrap(speed * elapsed, 0, N * 2);
    playDirection = cur > N ? 1 : -1;
  }

  let curFrameReal = speed * elapsed * playDirection;
  curFrameReal = wrap(curFrameReal, 0, N);

  let curFrame = Math.floor(curFrameReal);
  const fract = curFrameReal - curFrame;
  curFrame = Math.max(0, Math.min(curFrame, thread.frames.length - 1));
  return curFrame;
}

module.exports.expandAllPolylines = expandAllPolylines;
function expandAllPolylines(weave, resamplePaths) {
  weave.threads.forEach((thread) => {
    thread.frames.forEach((frame) => {
      frame.paths.forEach((path) => {
        if (path.strokeProfile) {
          path.offsetPaths = expandPolylines(thread, path, resamplePaths);
        }
      });
    });
  });
}

module.exports.expandPolylines = expandPolylines;
function expandPolylines(thread, path, resamplePaths = false) {
  const { strokeWidth = 1 } = thread.options;
  const lineWidth = Math.max(1e-5, strokeWidth);
  const polylines = getPolylines(path.commands);
  let index = 0;
  const scaledLines = polylines.map((polyline) => {
    let scaledLine = polyline.map((position, i, list) => {
      return {
        position,
        scale: path.strokeProfile[index + i],
      };
    });
    index += polyline.length;
    return scaledLine;
  });

  return scaledLines.map((input) => {
    if (resamplePaths) input = processInputPath(input, false);
    if (input.length === 0) {
      return [];
    } else {
      return offsetPath(input, {
        join: "round",
        cap: "round",
        width: lineWidth,
      }).contours;
    }
  });
}

function wrap(value, from, to) {
  if (typeof from !== "number" || typeof to !== "number") {
    throw new TypeError('Must specify "to" and "from" arguments as numbers');
  }
  // algorithm from http://stackoverflow.com/a/5852628/599884
  if (from > to) {
    var t = from;
    from = to;
    to = t;
  }
  var cycle = to - from;
  if (cycle === 0) {
    return to;
  }
  return value - cycle * Math.floor((value - from) / cycle);
}

function mod(a, b) {
  return ((a % b) + b) % b;
}

function getPolylines(commands) {
  const polylines = [];
  let line = [];
  let origin = null;
  commands.forEach((c) => {
    const t = c[0];
    const args = c.slice(1);
    if (t === "M") {
      if (line.length) {
        polylines.push(line);
        line = [];
      }
      origin = args;
      line.push(args.slice());
    } else if (t === "L") {
      if (!origin) origin = args;
      line.push(args.slice());
    } else if (t === "Z") {
      origin = null;
      if (line.length) {
        polylines.push(line);
        line = [];
      }
    }
  });
  if (line.length) {
    polylines.push(line);
    line = [];
  }
  return polylines;
}
