import GIF from "../vendor/gif.js";
import workerScript from "../vendor/gif.worker.js.as-url";
import Whammy from "../vendor/whammy";

export function isWebCodecsSupported() {
  return typeof window.VideoEncoder === "function";
}

function detectWebM() {
  var elem = document.createElement("canvas");
  if (!!(elem.getContext && elem.getContext("2d"))) {
    // was able or not to get WebP representation
    return elem.toDataURL("image/webp").indexOf("data:image/webp") == 0;
  } else {
    // very old browser like IE 8, canvas not supported
    return false;
  }
}

let _isWebM = detectWebM();

export function isWebMSupported() {
  return _isWebM;
}

export function isFrameSequenceSupported () {
  return typeof window.showDirectoryPicker === 'function';
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
    start = () => {},
    finish = () => {}
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
    if (e === null) cancelled = true;
    encoder = e;
    if (cancelled) {
      // if we cancelled while fetching the encoder
      resolve(null);
    } else {
      start();
      progress(0);
      timeHandle = setTimeout(tick, 0);
    }
  }, err => {
    cancelled = true;
    resolve(null);
  });

  return {
    ready: promise,
    cancel() {
      cancelled = true;
      clearTimeout(timeHandle);
      if (encoder) encoder.cancel();
      finishEncoding();
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
    } else if (format === 'sequence') {
      return SequenceExporter();
    } else {
      return WebMEncoder();
    }
  }

  function finishEncoding() {
    if (finished) return;
    finished = true;
    let p = encoder.end();
    if (cancelled) {
      resolve(null);
      finish();
    } else {
      p.then((buffer) => {
        resolve(cancelled ? null : buffer);
        finish();
      });
    }
  }

  async function tick() {
    if (cancelled) return;
    if (frameIndex < totalFrames) {
      // console.log("Rendering Frame %d / %d", frameIndex + 1, totalFrames);
      const imgData = render({
        deltaTime: fpsInterval,
        frame: frameIndex,
        totalFrames
      });
      await encoder.addFrame(imgData, frameIndex);
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
      finishEncoding();
    }
  }

  function nextEvent(target, name) {
    return new Promise((resolve) => {
      target.addEventListener(name, resolve, { once: true });
    });
  }

  async function SequenceExporter () {
    let dir;
    try {
      dir = await window.showDirectoryPicker();
    } catch (err) {
      if (err.code === 20 || err.name === 'AbortError') {
        // don't warn on abort
        return null;
      } else {
        throw err;
      }
    }
    return {
      async addFrame(frameData, frameIndex) {
        const { extension = '', prefix = '', type = '' } = frameData;

        const frameDigitCount = String(totalFrames).length;
        const curFrameName = String(frameIndex).padStart(frameDigitCount, '0');
        const curFrameFile = `${prefix}${curFrameName}${extension}`;

        const fh = await dir.getFileHandle(curFrameFile, { create: true });
        const fw = await fh.createWritable();

        let blob;
        if (frameData.url) {
          blob = createBlobFromDataURL(frameData.url);
        } else {
          const data = frameData.data || '';
          const parts = Array.isArray(data) ? data : [ data ];
          blob = new window.Blob(parts, { type });
        }

        await fw.write(blob);
        await fw.close();
      },
      cancel () {
      },
      async end () {
        console.log('Finished')
      }
    }
  }

  async function WebMEncoder() {
    const quality = 0.95;
    const encoder = new Whammy.Video(fps, quality);
    const webpCanvas = document.createElement("canvas");
    const webpContext = webpCanvas.getContext("2d");
    const images = [];
    let cancelled = false;

    return {
      async addFrame(imageData) {
        webpCanvas.width = imageData.width;
        webpCanvas.height = imageData.height;
        webpContext.putImageData(imageData, 0, 0);
        const url = webpCanvas.toDataURL("image/webp", encoder.quality);
        images.push(url);
      },
      cancel() {
        cancelled = true;
      },
      async end() {
        return new Promise((resolve) => {
          if (cancelled) {
            resolve(null);
          } else {
            const webm = Whammy.fromImageArray(images, fps, false);
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
      workerScript,
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


function createBlobFromDataURL (dataURL) {
  const splitIndex = dataURL.indexOf(',');
  if (splitIndex === -1) {
    return new Blob();
  }
  const base64 = dataURL.slice(splitIndex + 1);
  const byteString = atob(base64);
  const type = dataURL.slice(0, splitIndex);
  const mimeMatch = /data:([^;]+)/.exec(type);
  const mime = (mimeMatch ? mimeMatch[1] : '') || undefined;
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ ab ], { type: mime });
}
