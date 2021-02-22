import FastGIF, { quantize, nearest } from "gif-wasm/src/encoder.js";
import { nearestImageData } from "gif-wasm/src/palettize.js";

console.log("from worker", quantize);

self.addEventListener("message", (ev) => {
  const opts = ev.data;
  const data = opts.data;

  const { frame, width, height, delay } = opts;
  const hasAlpha = false;
  const maxColors = 256;
  const palette = quantize(data, width, height, 4, maxColors, false);
  const index = nearestImageData(data, width, height, 4, palette);
  const gif = FastGIF();
  gif.writeFrame(index, width, height, {
    first: frame === 0,
    repeat: 0,
    delay,
    palette,
  });
  const out = gif.bytesView();
  self.postMessage({ frame, data: out }, [out.buffer]);
});

// function getPixels(rgba, size) {
//   const pixels = new Array(size);
//   for (let i = 0; i < size; i++) {
//     const r = rgba[i * 4 + 0];
//     const g = rgba[i * 4 + 1];
//     const b = rgba[i * 4 + 2];
//     pixels[i] = [r, g, b];
//   }
//   return pixels;
// }
