import GIF from "../vendor/gif.js";
import workerScript from "../vendor/gif.worker.js.as-url";

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

  const totalPasses = format === "mp4" ? 1 : 2;

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
      return window.getMP4H264().then((Encoder) => MP4Encoder(Encoder));
    } else {
      return Promise.resolve(GIFEncoder());
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

  function tick() {
    if (cancelled) return;
    if (frameIndex < totalFrames) {
      // console.log("Rendering Frame %d / %d", frameIndex + 1, totalFrames);
      const imgData = render(fpsInterval);
      encoder.addFrame(imgData);
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

  function MP4Encoder(Encoder) {
    const encoder = Encoder.create({
      width,
      height,
      fps,
      stride: 4,
    });
    return {
      addFrame(imageData) {
        encoder.encodeRGB(imageData.data);
      },
      cancel() {},
      async end() {
        const buf = encoder.end();
        return buf;
      },
    };
  }

  function GIFEncoder() {
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
      addFrame(imageData) {
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
