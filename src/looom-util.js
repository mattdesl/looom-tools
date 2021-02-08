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
  const duration = thread.frames.length / speed;
  const N = thread.frames.length;
  const elapsed = latched ? 0 : time + timeOffset;

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
