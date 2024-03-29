<script>
  import parseLooom from "../../src/parse-looom-svg";
  import { createRenderer } from "../../src/canvas-rendering";
  import { createEventDispatcher, onMount } from "svelte";
  import objectFit from "../../src/util/fit";
  import createRecording from "./record";
  import Color from "canvas-sketch-util/color";

  import rightNow from "right-now";

  const MAX_SIZE = 4096 * 4;

  export let data = null;
  export let recenter = false;
  export let refit = true;
  export let resamplePaths = false;
  export let transparentBackground = false;
  export let fit = "contain";
  export let fitScale = 1;
  export let fitX = 0.5;
  export let fitY = 0.5;
  export let running = true;
  export let recording = false;

  // Size mode: 'weave', 'window', 'custom'
  export let sizing = "weave";
  export let customWidth = 1024;
  export let customHeight = 768;

  export let format = "mp4";
  export let fps = 30;
  export let duration = 5;
  export let qualityPreset = "high";
  export let quantizeWithAlpha = true;
  export let time = 0;
  export let scaleToView = true;

  const dispatcher = createEventDispatcher();
  let width, height, pixelRatio;
  let weave;
  let renderWeave;
  let canvas, context;
  let raf;
  let lastTime;
  let _isRunning = false;
  let _isRecording = false;
  let currentRecorder;

  let frameElapsed;
  let frameLastTime;

  $: recenter, resamplePaths, refit, fitX, fitY, fitScale, fit, reparse(data);
  $: sizing, customWidth, customHeight, resize();

  $: {
    if (recording) {
      stopLoop();
    } else {
      if (running) startLoop();
      else stopLoop();
    }

    if (recording) startRecord();
    else stopRecord();
  }

  function downloadBlob(buf, filename, type) {
    const blob = buf instanceof Blob ? buf : new Blob([buf], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  }

  export function downloadJSON() {
    if (!weave) {
      return alert("Drop a valid Looom file to download it");
    }
    const text = JSON.stringify(weave, undefined, 2);
    const type = "application/json";
    const blob = new Blob([text], { type });
    downloadBlob(blob, "weave.json", { type });
  }

  function reparse(data) {
    time = 0;
    if (data) {
      try {
        try {
          weave = parseLooom(data, {
            recenter,
          });
        } catch (err) {
          console.error(err);
          // mask huge SVG error
          throw new Error(`Could not parse SVG data from file`);
        }
        /*
        if (weave.version !== "2") {
          throw new Error(
            `Only supports weave version 2 files, got ${weave.version}`
          );
        }
        */
        renderWeave = createRenderer(weave, {
          refit,
          resamplePaths,
          fit: {
            fit,
            scale: fitScale,
            offsetX: fitX,
            offsetY: fitY,
          },
        });
      } catch (err) {
        console.error(err);
        window.alert(err.message);
        weave = renderWeave = null;
      }
    } else {
      weave = renderWeave = null;
    }
    if (canvas) resize();
    dispatcher("load", weave);
  }

  onMount(() => {
    context = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("orientationchange", resize, { passive: true });
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      stopLoop();
    };
  });

  function getKnownColors() {
    if (!weave) return [];
    const set = new Set();
    if (!transparentBackground) set.add(weave.backgroundColor);
    weave.threads.forEach((t) => {
      const opt = t.options;
      if (!opt.visible) return;
      if (opt.stroke && opt.strokeOpacity >= 1) {
        set.add(opt.stroke);
      }
      if (opt.fill && opt.fillOpacity >= 1) {
        set.add(opt.fill);
      }
    });
    return [...set].map((hex) => Color.parse(hex).rgb);
  }

  function startRecord() {
    if (_isRecording) return;
    _isRecording = true;
    resize(); // stop scaling to view
    redraw(); // force redraw so we don't see any missed frames
    // console.log("start record");
    const w = parseInt(canvas.width, 10);
    const h = parseInt(canvas.height, 10);
    let curTime = 0;
    dispatcher("recordStart");
    const formats = {
      mp4: { ext: ".mp4", type: "video/mp4" },
      gif: { ext: ".gif", type: "image/gif" },
      webm: { ext: ".webm", type: "video/webm" },
      "sequence:png": { ext: ".png", type: "image/png", sequence: true },
      "sequence:svg": { ext: ".svg", type: "image/svg+xml", sequence: true },
    };
    const { ext, type, sequence } = formats[format];

    const drawFrame = ({ deltaTime, frame, totalFrames }) => {
      curTime += deltaTime;
      redrawWithTime(curTime);
      if (sequence) {
        if (ext === ".svg") {
          return {
            extension: ext,
            type,
            data: `<svg><text>${frame}</text></svg>`,
          };
        } else {
          return {
            extension: ext,
            type,
            url: canvas.toDataURL(type),
          };
        }
      } else {
        const img = context.getImageData(0, 0, w, h);
        return img;
      }
    };

    const filename = `animation${ext}`;
    let startTime;
    const totalFrames = Math.ceil(fps * duration);
    currentRecorder = createRecording(canvas, drawFrame, {
      progress(opts) {
        dispatcher("recordProgress", opts);
      },
      backgroundColor: Color.parse(weave.backgroundColor || "#000").rgb,
      quantizeWithAlpha,
      transparent: transparentBackground,
      knownColors: getKnownColors(),
      width: w,
      height: h,
      duration,
      fps,
      format: sequence ? "sequence" : format,
      qualityPreset,
      start() {
        startTime = rightNow();
      },
      finish() {
        const endTime = rightNow();
        const elapsed = endTime - startTime;
        console.log("Finished in", elapsed, "ms");
        console.log("mspf", elapsed / totalFrames);
      },
    });
    currentRecorder.ready.then((buf) => {
      if (buf === null) {
        console.log("Recording cancelled");
        dispatcher("recordCancel");
      } else {
        dispatcher("recordSuccess");
        if (buf && !sequence) {
          downloadBlob(buf, filename, type);
        }
      }

      resize(); // scale back to view
      _isRecording = false;
      recording = false;
      currentRecorder = null;
      dispatcher("recordFinish");
    });
  }

  function stopRecord() {
    if (!_isRecording) return;
    // console.log("stop record");
    if (currentRecorder) {
      currentRecorder.cancel();
      currentRecorder = null;
    }
    _isRecording = false;
  }

  function startLoop() {
    if (_isRunning) return;
    const now = rightNow();
    lastTime = now;
    frameLastTime = now;
    raf = window.requestAnimationFrame(animate);
    _isRunning = true;
  }

  function stopLoop() {
    _isRunning = false;
    if (raf != null) {
      window.cancelAnimationFrame(raf);
      raf = null;
    }
  }

  function animate() {
    raf = window.requestAnimationFrame(animate);

    let now = rightNow();
    const dt = (now - lastTime) / 1000;
    if (running && _isRunning) {
      time += dt;
    }

    let newFrame = false;
    const fpsInterval = 1000 / fps;
    frameElapsed = now - frameLastTime;
    if (frameElapsed > fpsInterval) {
      frameLastTime = now - (frameElapsed % fpsInterval);
      newFrame = true;
    }

    // don't throttle any frames at 60+
    if (fps >= 60) newFrame = true;

    if (!_isRecording && newFrame) {
      redraw();
    }

    lastTime = now;
  }

  function redraw() {
    // time = 10 / fps;
    redrawWithTime(time);
  }

  function redrawWithTime(curTime = 0) {
    context.save();
    context.scale(pixelRatio, pixelRatio);
    // context.clearRect(0, 0, width, height);
    // context.fillStyle = "blue";
    // context.fillRect(0, 0, width, height);
    if (renderWeave) {
      let showBackground = !transparentBackground;
      if (format === "gif" && !quantizeWithAlpha) {
        // If we wish to quantize with just RGB channel,
        // then we can turn the background back on and alpha-cut it later
        showBackground = true;
      }
      renderWeave(context, {
        width,
        height,
        time: curTime,
        background: showBackground,
      });
    }
    context.restore();
  }

  function userSize(n) {
    if (isFinite(n) && n >= 2 && n <= MAX_SIZE) return n;
    return 1024; // default size
  }

  function resize() {
    if (!canvas) return;

    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    let tx = 0;
    let ty = 0;
    let styleWidth, styleHeight;
    if (sizing === "window") {
      pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      width = innerWidth;
      height = innerHeight;
      styleWidth = width;
      styleHeight = height;
    } else {
      pixelRatio = 1;

      if (sizing === "weave" && weave) {
        width = weave.width;
        height = weave.height;
      } else {
        width = userSize(customWidth);
        height = userSize(customHeight);
      }

      const fitted = objectFit({
        parentWidth: innerWidth,
        parentHeight: innerHeight,
        fit: "contain",
        scale: 0.8,
        childWidth: width,
        childHeight: height,
      });
      tx = fitted[0];
      ty = fitted[1];
      styleWidth = fitted[2];
      styleHeight = fitted[3];
    }

    // If we aren't recording and we are supposed to scale
    // to the browser view for faster rendering, let's do that here
    if (scaleToView && !_isRecording) {
      width = styleWidth;
      height = styleHeight;
      pixelRatio = Math.min(2, window.devicePixelRatio);
    }

    const canvasWidth = Math.floor(width * pixelRatio);
    const canvasHeight = Math.floor(height * pixelRatio);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.position = `relative`;
    canvas.style.left = `${tx}px`;
    canvas.style.top = `${ty}px`;
    canvas.style.width = `${styleWidth}px`;
    canvas.style.height = `${styleHeight}px`;
    if (!_isRecording) redraw();
  }
</script>

<div class="looom-container">
  <canvas bind:this={canvas} />
</div>

<style>
  .looom-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
