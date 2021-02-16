import GIF from "../vendor/gif.js";
import Whammy from "../util/whammy";
import webpWasm from "../vendor/wasm_webp.js";
import webpOptions from "../util/webp-options";

let webpModulePromise;

function getWebpEncoderModule() {
  if (webpModulePromise) return webpModulePromise;
  webpModulePromise = new Promise((resolve) => {
    const Module = webpWasm({
      locateFile() {
        console.log("locating");
        return "vendor/wasm_webp.wasm";
      },
      onRuntimeInitialized() {
        resolve(Module);
      },
    });
  });
  return webpModulePromise;
}

export function isWebCodecsSupported() {
  return typeof window.VideoEncoder === "function";
}

function detectWebM() {
  return true;
  // var elem = document.createElement("canvas");
  // if (!!(elem.getContext && elem.getContext("2d"))) {
  //   // was able or not to get WebP representation
  //   return elem.toDataURL("image/webp").indexOf("data:image/webp") == 0;
  // } else {
  //   // very old browser like IE 8, canvas not supported
  //   return false;
  // }
}

let _isWebM = detectWebM();

export function isWebMSupported() {
  return _isWebM;
}

export default function createRecorder(canvas, render, opts = {}) {
  const {
    duration = 5,
    fps = 30,
    qualityPreset = "high",
    format = "mp4",
    width = 512,
    height = 512,
    progress = (v) => {},
  } = opts;
  const totalFrames = Math.ceil(fps * duration);
  const fpsInterval = 1 / fps;
  const frames = new Array(totalFrames).fill(0).map((_, i) => i);

  let cancelled = false;
  let timeHandle = null;
  let frameIndex = 0;
  let finished = false;

  const totalPasses = format === "gif" ? 2 : 1;

  let resolve;
  const promise = new Promise((cb) => {
    resolve = cb;
  });

  let encoder;
  getEncoder().then((e) => {
    encoder = e;
    if (cancelled) {
      // if we cancelled while fetching the encoder
      resolve(null);
    } else {
      progress(0);
      timeHandle = setTimeout(tick, 0);
    }
  });

  return {
    ready: promise,
    cancel() {
      cancelled = true;
      clearTimeout(timeHandle);
      if (encoder) encoder.cancel();
      finish();
    },
  };

  function getEncoder() {
    if (format === "mp4") {
      if (!isWebCodecsSupported()) {
        throw new Error("format { mp4 } but WebCodecs is not supported");
      }
      return window.loadMP4Module().then((MP4) => MP4Encoder(MP4));
    } else if (format === "gif") {
      return GIFEncoder();
    } else {
      return WebMEncoder();
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    let p = encoder.end();
    if (cancelled) {
      resolve(null);
    } else {
      p.then((buffer) => {
        resolve(cancelled ? null : buffer);
      });
    }
  }

  async function tick() {
    if (cancelled) return;
    if (frameIndex < totalFrames) {
      // console.log("Rendering Frame %d / %d", frameIndex + 1, totalFrames);
      const imgData = render(fpsInterval);
      await encoder.addFrame(imgData);
      progress({
        progress: frameIndex / totalFrames,
        totalFrames,
        totalPasses,
        pass: 0,
        frame: frameIndex,
      });
      frameIndex++;
      timeHandle = setTimeout(tick, 0);
    } else {
      console.log("Finished");
      progress(1);
      finish();
    }
  }

  function nextEvent(target, name) {
    return new Promise((resolve) => {
      target.addEventListener(name, resolve, { once: true });
    });
  }

  async function WebMEncoder() {
    const quality = 0.95;
    const encoder = new Whammy.Video(fps, quality);
    const webpCanvas = document.createElement("canvas");
    const webpContext = webpCanvas.getContext("2d");
    const images = [];
    let frame = 0;
    const webp = await getWebpEncoderModule();

    let cancelled = false;

    function convertBinaryStringToUint8Array(bStr) {
      var i,
        len = bStr.length,
        u8_array = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        u8_array[i] = bStr.charCodeAt(i);
      }
      return u8_array;
    }

    function convertUint8ArrayToBinaryString(u8Array) {
      var i,
        len = u8Array.length,
        b_str = "";
      for (i = 0; i < len; i++) {
        b_str += String.fromCharCode(u8Array[i]);
      }
      return b_str;
    }

    return {
      async addFrame(imageData) {
        // webpCanvas.width = imageData.width;
        // webpCanvas.height = imageData.height;
        // webpContext.putImageData(imageData, 0, 0);
        // const url = webpCanvas.toDataURL("image/webp", encoder.quality);

        console.log("frame", frame++);
        const binary = webp.encode(
          imageData.data,
          imageData.width,
          imageData.height,
          4,
          webpOptions
        );

        // const binaryString = atob(url.slice(23));
        // const binary = convertBinaryStringToUint8Array(binaryString);
        const binaryString = convertUint8ArrayToBinaryString(binary);
        // webp.free();

        images.push(binaryString);
      },
      cancel() {
        cancelled = true;
      },
      async end() {
        return new Promise((resolve) => {
          if (cancelled) {
            resolve(null);
          } else {
            const webm = Whammy.fromBinaryArray(images, fps, false);
            resolve(webm);
          }
        });
      },
    };
  }

  async function MP4Encoder(MP4) {
    const encoder = MP4.createWebCodecsEncoder({
      width,
      height,
      fps,
    });
    return {
      async addFrame(imageData) {
        // Create a bitmap out of the frame
        const bitmap = await createImageBitmap(imageData);

        // Add bitmap to encoder
        await encoder.addFrame(bitmap);
      },
      cancel() {},
      async end() {
        return encoder.end();
      },
    };
  }

  async function GIFEncoder() {
    let fpsInterval = 1 / fps;

    const gif = new GIF({
      width,
      height,
      workerScript: "vendor/gif.worker.js",
      workers: 3,
      background: "#000",
      quality: 50,
    });

    let resolve;
    let promise = new Promise((cb) => {
      resolve = cb;
    });
    gif.on("finished", (blob) => {
      resolve(blob);
    });
    gif.on("progress", (v) => {
      progress({
        progress: v,
        totalFrames,
        totalPasses,
        pass: 1,
        frame: undefined,
      });
    });

    return {
      async addFrame(imageData) {
        gif.addFrame(imageData, { delay: fpsInterval * 1000 });
      },
      cancel() {},
      async end() {
        gif.render();
        return promise;
      },
    };
  }
}
