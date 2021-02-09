<script>
  import parseLooom from "../src/parse-looom-svg";
  import { createRenderer } from "../src/canvas-rendering";
  import { createEventDispatcher, onMount } from "svelte";
  import objectFit from "../src/util/fit";

  import rightNow from "right-now";

  export let data = null;
  export let recenter = false;
  export let refit = true;
  export let resamplePaths = false;
  export let fit = "contain";
  export let fitScale = 1;
  export let fitX = 0.5;
  export let fitY = 0.5;
  export let running = true;

  const MAX_SIZE = 4096 * 4;

  // Size mode: 'weave', 'window', 'custom'
  export let sizing = "weave";
  export let customWidth = 1024;
  export let customHeight = 768;

  const dispatcher = createEventDispatcher();
  let width, height, pixelRatio;
  let weave;
  let renderWeave;
  let canvas, context;
  let raf;
  let lastTime;
  let time = 0;

  $: resamplePaths, refit, fitX, fitY, fitScale, fit, reparse(data);
  $: sizing, customWidth, customHeight, resize();

  function reparse(data) {
    lastTime = rightNow();
    time = 0;
    if (data) {
      console.log("Parsing");
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
        if (weave.version !== "2") {
          throw new Error(
            `Only supports weave version 2 files, got ${weave.version}`
          );
        }
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
    raf = window.requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.cancelAnimationFrame(raf);
    };
  });

  function animate() {
    raf = window.requestAnimationFrame(animate);

    let now = rightNow();
    const dt = (now - lastTime) / 1000;

    context.save();

    context.scale(pixelRatio, pixelRatio);
    context.clearRect(0, 0, width, height);

    if (renderWeave) {
      if (running) time += dt;
      renderWeave(context, { width, height, time });
    }

    context.restore();

    lastTime = now;
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

    const canvasWidth = Math.floor(width * pixelRatio);
    const canvasHeight = Math.floor(height * pixelRatio);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.position = `relative`;
    canvas.style.left = `${tx}px`;
    canvas.style.top = `${ty}px`;
    canvas.style.width = `${styleWidth}px`;
    canvas.style.height = `${styleHeight}px`;
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
