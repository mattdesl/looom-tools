<script>
  import parseLooom from "../src/parse-looom-svg";
  import { createRenderer } from "../src/canvas-rendering";
  import { createEventDispatcher, onMount } from "svelte";
  import rightNow from "right-now";

  export let data = null;
  export let recenter = false;
  export let refit = true;
  export let resamplePaths = false;
  export let fit = "contain";
  export let fitScale = 1;
  export let fitX = 0.5;
  export let fitY = 0.5;
  export let matchWeaveSize = false;

  const dispatcher = createEventDispatcher();
  let width, height, pixelRatio;
  let weave;
  let renderWeave;
  let canvas, context;
  let raf;
  let lastTime;
  let time = 0;

  $: reparse(data);

  function reparse(data) {
    lastTime = rightNow();
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
    if (canvas && matchWeaveSize) resize();
    dispatcher("load", weave);
  }

  onMount(() => {
    context = canvas.getContext("2d");
    resize();
    raf = window.requestAnimationFrame(animate);
    return () => {
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
      time += dt;
      renderWeave(context, { width, height, time });
    }

    context.restore();

    lastTime = now;
  }

  function resize() {
    if (matchWeaveSize && weave) {
      width = weave.width;
      height = weave.height;
      pixelRatio = 1;
    } else {
      pixelRatio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
    }
    const canvasWidth = Math.floor(width * pixelRatio);
    const canvasHeight = Math.floor(height * pixelRatio);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
</script>

<canvas bind:this={canvas} />
<svelte:window on:resize|passive={resize} />
