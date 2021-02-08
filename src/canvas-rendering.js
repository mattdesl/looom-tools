const {
  getFrameIndex,
  expandPolylines,
  expandAllPolylines,
} = require("./looom-util");

const fitObject = require("./util/fit");
const { mat2d } = require("gl-matrix");

module.exports.createRenderer = createRenderer;

function createRenderer(weave, opts = {}) {
  // clone as we will make modifications to it
  // weave = clone(weave);

  // expand polylines
  // expandPolylines(weave);

  const { resamplePaths = false, cacheOffsetPaths = true } = opts;

  let refit = true;
  if (opts.fit === false) refit = false;
  const fitOpts = opts.fit && typeof opts.fit === "object" ? opts.fit : {};
  const { fit = "contain", scale = 1, offsetX = 0.5, offsetY = 0.5 } = fitOpts;

  const refitTransform = mat2d.identity([]);
  const offscreen = createContext();
  let shared_mask = {
    bitmask: createContext(),
    children: createContext(),
    buffer: createContext(),
  };

  if (cacheOffsetPaths) {
    expandAllPolylines(weave, resamplePaths);
  }

  return (context, props) => {
    const { width = weave.width, height = weave.height, time = 0 } = props;

    if (refit !== false) {
      const fitted = fitObject({
        fit,
        scale,
        offsetX,
        offsetY,
        parentWidth: width,
        parentHeight: height,
        childWidth: weave.width,
        childHeight: weave.height,
      });
      const sx = fitted[2] / weave.width;
      const sy = fitted[3] / weave.height;
      mat2d.identity(refitTransform);
      mat2d.translate(refitTransform, refitTransform, [fitted[0], fitted[1]]);
      mat2d.scale(refitTransform, refitTransform, [sx, sy]);
    }

    context.fillStyle = weave.backgroundColor;
    context.clearRect(0, 0, width, height);
    context.fillRect(0, 0, width, height);

    let current_mask = null;

    weave.threads.forEach((thread, i, threads) => {
      const { masked = false } = thread.options;
      const next_masked =
        i < threads.length - 1 ? threads[i + 1].options.masked || false : false;

      if (!masked) {
        // We aren't in a mask layer
        // We should check here if we need to apply
        // the mask layer. We do this by drawing
        // the bitmask first with source-over,
        // then the children with source-out
        if (current_mask != null) {
          applyMask(context, current_mask, width, height);
          current_mask = null;
        }
      }

      let isBaseMaskLayer = false;
      let isInnerMaskLayer = false;

      if (current_mask == null && next_masked) {
        // We're at the base layer of a mask
        // Draw its content into the mask content, then draw
        // its content again as black+white only
        // to its own bitmask layer. This will be used
        // once we 'exit' the mask stack to actually carve out the mask
        isBaseMaskLayer = true;
      } else if (masked && current_mask != null) {
        // We're inside a mask layer, so we draw
        // to the mask buffer with full color + blending
        isInnerMaskLayer = true;
      }

      if ((isBaseMaskLayer || isInnerMaskLayer) && current_mask == null) {
        const w = context.canvas.width;
        const h = context.canvas.height;
        current_mask = shared_mask;
        resetMask(current_mask, w, h);
      }

      const transform = context.getTransform();
      const currentContext =
        isBaseMaskLayer || isInnerMaskLayer
          ? current_mask.children.context
          : context;

      currentContext.setTransform(transform);

      // draw it with full color
      drawThreadToBuffer(currentContext, thread, time);

      if (isBaseMaskLayer) {
        // draw it with black/white
        current_mask.bitmask.context.setTransform(transform);
        drawThreadToBuffer(current_mask.bitmask.context, thread, time, true);
      }
    });

    if (current_mask != null) {
      applyMask(context, current_mask, width, height);
      current_mask = null;
    }
  };

  function drawThreadToBuffer(context, thread, time, masking = false) {
    if (!isThreadVisible(thread)) return;

    offscreen.canvas.width = context.canvas.width;
    offscreen.canvas.height = context.canvas.height;
    offscreen.context.resetTransform();
    offscreen.context.setTransform(context.getTransform());

    offscreen.context.save();

    // User may choose not to re-fit to output bounds
    offscreen.context.transform(...refitTransform);

    // viewBox transformation
    offscreen.context.transform(...weave.view);

    // root weave transformation
    offscreen.context.transform(...weave.transform);

    // render the thread to buffer
    renderThread(
      offscreen.context,
      thread,
      time,
      resamplePaths,
      cacheOffsetPaths,
      masking
    );

    offscreen.context.restore();

    // now draw buffer to screen with blending
    const {
      blendMode = 0,
      stroke,
      fill,
      strokeOpacity,
      fillOpacity,
    } = thread.options;
    context.globalCompositeOperation = masking
      ? "source-over"
      : getBlendMode(blendMode);

    let opacity = 1;
    if (masking || blendMode > 1) opacity = 1;
    else if (stroke && strokeOpacity > 0) opacity = strokeOpacity;
    else opacity = fillOpacity;
    const oldTransform = context.getTransform();
    context.resetTransform();
    context.globalAlpha = opacity;
    context.drawImage(offscreen.canvas, 0, 0);
    context.globalCompositeOperation = "source-over";
    context.setTransform(oldTransform);
  }

  function resetMask(mask, w, h) {
    const { buffer, bitmask, children } = mask;
    buffer.canvas.width = w;
    buffer.canvas.height = h;
    bitmask.canvas.width = w;
    bitmask.canvas.height = h;
    children.canvas.width = w;
    children.canvas.height = h;
  }

  function applyMask(context, mask, width, height) {
    mask.buffer.context.globalCompositeOperation = "source-over";
    mask.buffer.context.drawImage(mask.bitmask.canvas, 0, 0);
    mask.buffer.context.globalCompositeOperation = "source-in";
    mask.buffer.context.drawImage(mask.children.canvas, 0, 0);
    mask.buffer.context.globalCompositeOperation = "source-over";

    context.drawImage(mask.buffer.canvas, 0, 0, width, height);
  }

  function createContext(w = 300, h = 150) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return {
      canvas,
      context: canvas.getContext("2d"),
    };
  }
}

function isThreadVisible(thread) {
  let { visible = true, fillOpacity, strokeOpacity } = thread.options;
  return visible && (strokeOpacity > 0 || fillOpacity > 0);
}

function renderThread(
  context,
  thread,
  time,
  resamplePaths,
  cacheOffsetPaths,
  masking = false
) {
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
    stroke,
    strokeLinecap,
    strokeLinejoin,
    strokeWidth = 1,
  } = thread.options;

  let { fillOpacity, strokeOpacity } = thread.options;

  const show = visible && (strokeOpacity > 0 || fillOpacity > 0);
  const frameInterval = 1 / speed;

  if (!show) {
    return false;
  }

  const maskForeground = "black";

  // start thread transformation
  context.save();
  context.transform(...thread.transform);

  // get current frame
  const curFrame = getFrameIndex(thread, time);
  const frame = thread.frames[curFrame];
  const isStroke = stroke && strokeOpacity > 0;

  // apply frame transformation
  context.transform(...frame.transform);
  if (strokeLinejoin) context.lineJoin = strokeLinejoin;
  if (strokeLinecap) context.lineCap = strokeLinecap;
  context.lineWidth = Math.max(1e-5, strokeWidth);

  // render each path in frame
  frame.paths.forEach((path) => {
    // apply path transformation
    context.save();
    context.transform(...path.transform);

    if (isStroke && path.strokeProfile) {
      let offsetPaths = path.offsetPaths;
      if (!offsetPaths) {
        offsetPaths = expandPolylines(thread, path, resamplePaths);
        if (cacheOffsetPaths) path.offsetPaths = offsetPaths;
      }

      context.fillStyle = masking ? maskForeground : stroke;
      offsetPaths.forEach((contours) => {
        drawContours(context, contours);
      });
      context.globalAlpha = 1;
      context.fill();
    } else {
      context.beginPath();
      drawCommands(context, path.commands);

      if (fill && fillOpacity > 0) context.fillStyle = fill;
      if (stroke && strokeOpacity > 0) context.strokeStyle = stroke;
      if (masking) {
        context.fillStyle = maskForeground;
        context.strokeStyle = maskForeground;
      }
      if (fill && fillOpacity > 0) {
        context.globalAlpha = 1;
        context.fill();
      } else {
        context.globalAlpha = 1;
        context.stroke();
      }
    }
    context.restore();
  });
  context.restore();
}

function getBlendMode(n) {
  switch (n) {
    case 1:
      return "lighter";
    case 2:
      return "multiply";
    case 3:
      return "exclusion";
    default:
      return "source-over";
  }
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
