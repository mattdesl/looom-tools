export default function createRecorder(canvas, render, opts = {}) {
  const {
    duration = 5,
    fps = 30,
    qualityPreset = "high",
    format = "mp4",
    width = 512,
    height = 512,
    progress = (v) => console.log("progress", v),
  } = opts;
  const totalFrames = Math.ceil(fps * duration);
  const fpsInterval = 1 / fps;
  const frames = new Array(totalFrames).fill(0).map((_, i) => i);

  // for (let i of frames) {
  //   console.log("Frame %d / %d", i + 1, totalFrames);
  //   await new Promise((resolve) => setTimeout(resolve, 0));
  // }

  let cancelled = false;
  let timeHandle = null;
  let frameIndex = 0;

  let resolve;
  const promise = new Promise((cb) => {
    resolve = cb;
  });

  let encoder;
  window.getMP4H264().then((Encoder) => {
    if (cancelled) {
      // if we cancelled while fetching the encoder
      resolve(null);
    } else {
      progress(0);
      timeHandle = setTimeout(tick, 0);
      encoder = Encoder.create({
        width,
        height,
        fps,
        stride: 4,
      });
    }
  });

  return {
    ready: promise,
    cancel() {
      cancelled = true;
      clearTimeout(timeHandle);
    },
  };

  function tick() {
    if (cancelled) return;
    if (frameIndex < totalFrames) {
      console.log("Rendering Frame %d / %d", frameIndex + 1, totalFrames);
      const imgData = render(fpsInterval);
      encoder.encodeRGB(imgData);
      progress(frameIndex / totalFrames);
      frameIndex++;
      timeHandle = setTimeout(tick, 0);
    } else {
      console.log("Finished");
      const buffer = encoder.end();
      encoder = null;
      progress(1);
      resolve(buffer);
    }
  }
}
