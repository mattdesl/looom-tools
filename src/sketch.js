const canvasSketch = require("canvas-sketch");
const parse = require("./parse-looom-svg");
const createInputEvents = require("simple-input-events");
const fit = require("./fit");
const offsetPath = require("./offset-path");

const palettes = require("chromotome")
  .getAll()
  .map((c) => c.colors)
  .filter((c) => c.length >= 3);
const Random = require("canvas-sketch-util/random");
Random.setSeed("895540" || Random.getRandomSeed());
console.log(Random.getSeed());
const math = require("canvas-sketch-util/math");

const settings = {
  suffix: Random.getSeed(),
  dimensions: [1080, 768],
  animate: true,
};

const sketch = async ({ update, canvas }) => {
  const resp = await fetch("test/fixtures/private/Grid.svg");
  const svgText = await resp.text();
  const weave = parse(svgText);

  update({
    // dimensions: [weave.width, weave.height],
    duration: weave.duration * 4,
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
  // console.profile("paths");
  // console.time("pathtime");
  let count = 0;
  weave.threads.forEach((thread) => {
    const { strokeWidth = 1 } = thread.options;
    const lineWidth = Math.max(1e-5, strokeWidth);
    thread.frames.forEach((frame) => {
      frame.paths.forEach((path) => {
        if (path.strokeProfile) {
          const polylines = getPolylines(path.commands);
          let index = 0;
          path.offsetPaths = polylines.map((polyline) => {
            const scaledLine = polyline.map((position, i) => {
              return {
                position,
                scale: path.strokeProfile[index + i],
              };
            });
            index += polyline.length;
            if (scaledLine.length === 0) {
              return [];
            } else if (scaledLine.length === 1) {
              const point = scaledLine[0];
              const [cx, cy] = point.position;
              const radius = point.scale * (lineWidth / 2);
              const steps = 16;
              const contour = [];
              for (let k = 0; k < steps; k++) {
                const t = k / steps;
                const angle = t * Math.PI * 2;
                const x = Math.cos(angle) * radius + cx;
                const y = Math.sin(angle) * radius + cy;
                contour.push([x, y]);
              }
              return [contour];
            } else {
              return offsetPath(scaledLine, {
                lineJoin: "round",
                lineCap: "round",
                lineWidth,
              }).contours;
            }
          });
        }
      });
    });
  });
  // console.timeEnd("pathtime");
  // console.profileEnd("paths");
  console.log("count", count);
  // nextColors();

  let parallax = [0, 0],
    newParallax = [0, 0];
  const depthOffset = 0;
  const k = 1;
  const input = createInputEvents(canvas).on("move", ({ uv }) => {
    newParallax = [(uv[0] * 2 - 1) * k, (uv[1] * 2 - 1) * k];
  });

  return {
    render,
    begin() {
      // nextColors();
    },
  };

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

  function renderWeave(context, weave, time) {
    const viewBox = weave.viewBox;
    const [minX, minY, vw, vh] = viewBox;
    context.save();
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
        latched,
        masked = false,
        playMode = 1,
        fill,
        fillOpacity,
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
      if (!show) return;

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
      const isStroke = stroke && strokeOpacity > 0;
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
        if (isStroke && path.offsetPaths) {
          context.fillStyle = stroke;
          path.offsetPaths.forEach((contours) => {
            drawContours(context, contours);
          });
          context.globalAlpha = strokeOpacity != null ? strokeOpacity : 1;
          // context.lineWidth = 2;
          // context.stroke();
          context.fill();
          getPolylines(path.commands).forEach((polyline) => {
            polyline.forEach((point) => {
              context.beginPath();
              context.arc(...point, 0.5, 0, Math.PI * 2);
              context.fillStyle = "black";
              // context.fill();
            });
          });
        } else {
          context.beginPath();
          drawCommands(context, path.commands);
          if (fill && fillOpacity > 0) {
            context.globalAlpha = fillOpacity != null ? fillOpacity : 1;
            context.fill();
          } else {
            context.globalAlpha = strokeOpacity != null ? strokeOpacity : 1;
            context.stroke();
          }
        }
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

  function render({ context, width, height, time, deltaTime }) {
    math.dampArray(parallax, newParallax, 10, deltaTime, parallax);

    context.save();
    context.fillStyle = weave.backgroundColor;
    context.fillRect(0, 0, width, height);

    // context.beginPath();
    // context.arc(width / 2, height / 2, width / 4, 0, Math.PI * 2);
    // context.lineWidth = 30;
    // context.stroke();
    // context.clip();
    // context.fillStyle = "yellow";
    // context.fillRect(0, 0, width / 2, height / 2);

    // context.restore();

    const fitted = fit({
      fit: "cover",
      scale: 1.5,
      offsetX: 0.45,
      offsetY: 0.5,
      parentWidth: width,
      parentHeight: height,
      childWidth: weave.width,
      childHeight: weave.height,
    });
    const sx = fitted[2] / weave.width;
    const sy = fitted[3] / weave.height;
    context.translate(fitted[0], fitted[1]);
    context.scale(sx, sy);

    renderWeave(context, weave, time);
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

function drawContours(context, contours) {
  context.beginPath();
  contours.forEach((path) => {
    path.forEach((point, i) => {
      if (i === 0) context.moveTo(point[0], point[1]);
      else context.lineTo(point[0], point[1]);
    });
    context.closePath();
  });
}
