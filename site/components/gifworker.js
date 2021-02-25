import {
  quantize,
  applyPalette,
  prequantize,
  GIFEncoder,
  findTransparentIndex,
  nearestColorIndexWithDistance,
  colorSnap,
} from "gifenc";

const DEFAULT_BACKGROUND = [0, 0, 0];

self.addEventListener("message", (ev) => {
  const opts = ev.data;
  const data = opts.data;

  const {
    frame,
    width,
    height,
    delay,
    knownColors,
    quantizeWithAlpha = true,
    backgroundColor = DEFAULT_BACKGROUND,
  } = opts;

  let transparent = Boolean(opts.transparent);

  const maxColors = 256;

  // Three modes:
  // Opaque (no transparency)
  // Transparent w/ Alpha: input is RGBA, first pixel with 0 alpha becomes transparnet
  // Transparent w/o Alpha: input is opaque RGB, pixel closest to BG color becomes transparent

  // So we need to choose the format depending on the above move
  let format = "rgb444";
  if (transparent && quantizeWithAlpha) {
    // Quantizer must support alpha channel
    format = "rgba4444";
  }

  const uint32 = new Uint32Array(data.buffer);

  // Pre-quantization: preparing the data so it's a bit easier
  // to work with.
  // with GIF we have 1-bit alpha only
  prequantize(uint32, { roundRGB: 1, oneBitAlpha: true });

  // Quantization to N colors with 1-bit alpha
  const palette = quantize(uint32, maxColors, { format, oneBitAlpha: true });

  // optionally snap colors to known palette
  // TODO: evaluate whether this is really needed - quantizer seems to pick up
  // exact colors 1:1 most of the time anyways?
  if (knownColors) {
    colorSnap(palette, knownColors);
  }

  // Handle transparency
  let transparentIndex = 0;
  if (transparent) {
    if (quantizeWithAlpha) {
      // Find the first pixel with zero alpha
      // This is only possible if we quantize with a RGBA format
      transparentIndex = palette.findIndex((p) => p[3] === 0);
    } else {
      // Find the color in palette that is closest to user-specified transparent color
      const result = nearestColorIndexWithDistance(palette, backgroundColor);
      // Special case here: what if a single frame of the animation doesn't include
      // any transparent background? For example, the user has filled the whole screen with
      // a color for 1 frame. Then we don't want to choose the wrong pixel and make it disappear.
      // So let's only apply transparency for this frame if we find a close enough match.
      const dist = Math.sqrt(result[1]);
      if (dist <= 5) {
        transparentIndex = result[0];
      } else {
        // This frame has no transparent pixels
        transparent = false;
      }
    }
  }

  // Now get an indexed bitmap
  const index = applyPalette(uint32, palette, format);

  // encode single frame
  const gif = GIFEncoder({ auto: false });
  gif.writeFrame(index, width, height, {
    first: frame === 0,
    repeat: 0,
    delay,
    transparent,
    transparentIndex,
    palette,
  });
  const output = gif.bytesView();
  self.postMessage({ frame, data: output }, [output.buffer]);
});
