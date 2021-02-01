const canvasSketch = require("canvas-sketch");
const parse = require("./parse-looom-svg");
const createInputEvents = require("simple-input-events");
const fit = require("./fit");

const palettes = require("chromotome")
  .getAll()
  .map((c) => c.colors);
const Random = require("canvas-sketch-util/random");
const math = require("canvas-sketch-util/math");

const settings = {
  animate: true,
};

const sketch = async ({ update, canvas }) => {
  const resp = await fetch("test/fixtures/Neon.svg");
  const svgText = await resp.text();
  const weave = parse(svgText);

  console.log(weave.duration);
  update({
    // dimensions: [weave.width, weave.height],
    duration: weave.duration * 1,
  });

  let palette, background;
  const nextColors = () => {
    palette = Random.shuffle(Random.pick(palettes).slice());
    weave.backgroundColor = palette.shift();
    weave.threads.forEach((thread) => {
      const color = Random.pick(palette);
      thread.options.stroke = color;
      thread.options.fill = color;
    });
  };
  nextColors();

  let parallax = [0, 0],
    newParallax = [0, 0];
  const depthOffset = 200;
  const k = 1;
  const input = createInputEvents(canvas).on("move", ({ uv }) => {
    newParallax = [(uv[0] * 2 - 1) * k, (uv[1] * 2 - 1) * k];
  });

  return {
    render,
    begin() {
      nextColors();
    },
  };

  function render({ context, width, height, time, deltaTime }) {
    math.dampArray(parallax, newParallax, 10, deltaTime, parallax);

    context.save();
    context.fillStyle = weave.backgroundColor;
    context.fillRect(0, 0, width, height);

    const viewBox = weave.viewBox;
    const [minX, minY, vw, vh] = viewBox;

    const fitted = fit({
      fit: "contain",
      parentWidth: width,
      parentHeight: height,
      childWidth: weave.width,
      childHeight: weave.height,
    });
    const sx = fitted[2] / weave.width;
    const sy = fitted[3] / weave.height;
    context.translate(fitted[0], fitted[1]);
    context.scale(sx, sy);

    context.translate(-minX, -minY);
    context.scale(weave.width / vw, weave.height / vh);

    context.transform(...weave.transform);

    let clipping = false;

    weave.threads.forEach((thread, i, threads) => {
      const {
        visible = true,
        timeOffset = 0,
        speed = 12,
        blendMode = 0,
        bookmarkIndex = -1,
        fillOpacity,
        latched,
        masked = false,
        playMode = 1,
        fill,
        stroke,
        strokeLinecap,
        strokeLinejoin,
        strokeOpacity,
        strokeWidth = 1,
      } = thread.options;

      // if we are in clip mode but this layer is not a mask
      // it means we are starting a new base layer
      // if (clipping && !masked) {
      //   context.restore();
      //   clipping = false;
      // }

      const K = threads.length <= 1 ? 0.5 : i / (threads.length - 1);
      const depth = (K * 2 - 1) * depthOffset;

      const show = visible && (strokeOpacity > 0 || fillOpacity > 0);
      const frameInterval = 1 / speed;

      context.save();
      context.transform(...thread.transform);

      const duration = thread.frames.length / speed;
      const N = thread.frames.length;
      const elapsed = (latched ? 0 : time) + timeOffset;
      let curFrameReal = speed * elapsed;
      curFrameReal = wrap(curFrameReal, 0, N);
      let curFrame = Math.floor(curFrameReal);
      const fract = curFrameReal - curFrame;
      curFrame = Math.max(0, Math.min(curFrame, thread.frames.length - 1));

      const frame = thread.frames[curFrame];
      // context.save();
      context.transform(...frame.transform);
      if (fill && fillOpacity > 0) context.fillStyle = fill;
      if (stroke && strokeOpacity > 0) context.strokeStyle = stroke;
      if (strokeLinejoin) context.lineJoin = strokeLinejoin;
      if (strokeLinecap) context.lineCap = strokeLinecap;
      context.lineWidth = Math.max(1e-5, strokeWidth);
      frame.paths.forEach((path) => {
        context.save();
        context.transform(...path.transform);
        context.translate(parallax[0] * depth, parallax[1] * depth);
        context.beginPath();
        drawCommands(context, path.commands);
        if (fill && fillOpacity > 0) context.fill();
        else context.stroke();
        context.restore();
      });

      // is next thread a mask of this?
      // also ensure we aren't already in clip mode!
      // const nextThread = i < threads.length - 1 ? threads[i + 1] : null;
      // if (nextThread && nextThread.options.masked && !clipping) {
      //   context.save();
      //   frame.paths.forEach((path) => {
      //     context.beginPath();
      //     drawCommands(context, path.commands);
      //   });
      //   context.lineWidth = 1e-5;
      //   context.clip();
      //   clipping = true;
      // }

      // context.restore();
      context.restore();
    });

    // if we are still in clip mode (i.e. last thread was a mask)
    // then jump out of it
    // if (clipping) {
    //   context.restore();
    //   clipping = false;
    // }

    context.restore();
  }
};

canvasSketch(sketch, settings);

function drawCommands(context, commands) {
  for (let i = 0; i < commands.length; i++) {
    const c = commands[i];
    const args = c.slice(1);
    const type = c[0];
    if (type === "M") {
      context.moveTo(...args);
    } else if (type === "L") {
      context.lineTo(...args);
    } else if (type === "Z") {
      context.closePath();
    } else {
      throw new Error(
        `path command type ${type} not yet supported by renderer`
      );
    }
  }
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
