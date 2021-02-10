<script>
  // const parse = require("../src/parse-looom-svg");
  // const { createRenderer } = require("../src/canvas-rendering");

  import LooomCanvas from "./components/LooomCanvas.svelte";

  import Color from "canvas-sketch-util/color";
  import Random from "canvas-sketch-util/random";
  import dragDrop from "drag-drop";
  import initialSVGUrl from "../test/fixtures/Earthy1.svg";
  import Settings from "./components/Settings.svelte";
  import ToggleButton from "./components/ToggleButton.svelte";

  let settings = {};

  let running = true;
  let recording = false;
  let showSettings = false;
  let progress = 0;

  $: if (recording) showSettings = false;

  let svg;
  let foreground, background;
  let initialBackground = Color.parse({
    hsl: [Random.range(0, 360), 80, 90],
  }).hex;

  let loadInitial = true;
  (async () => {
    const resp = await fetch(initialSVGUrl);
    const text = await resp.text();
    if (loadInitial) svg = text;
  })();

  dragDrop(document.body, async (files) => {
    loadInitial = false;
    svg = await readFile(files[0]);
  });

  setBackground(initialBackground);

  async function readFile(file) {
    return new Promise((resolve, reject) => {
      const name = file.name;
      const reader = new FileReader();
      reader.onload = ({ target }) => {
        resolve(target.result);
      };
      reader.onerror = () => reject(new Error(`Error reading ${name}`));
      reader.readAsText(file);
    });
  }

  function setBackground(color, blending) {
    foreground = bestForeground(color);
    background = blending ? Color.blend(color, foreground, 0.1).hex : color;
    foreground = Color.blend(foreground, color, 0.15).hex;
    document.body.style.backgroundColor = background;
    document.body.style.color = foreground;
    const corner = document.querySelector(".github-corner svg");
    if (corner) {
      corner.style.fill = Color.blend(foreground, color, 0.5).hex;
      corner.style.opacity = 1;
      corner.style.color = background;
    }
  }

  function bestForeground(color) {
    const a = Color.contrastRatio(color, "black");
    const b = Color.contrastRatio(color, "white");
    return a >= b ? "black" : "white";
  }
</script>

<main>
  <div class="canvas-container">
    <LooomCanvas
      resamplePaths={settings.resamplePaths}
      recenter={settings.recenter}
      fps={settings.fps}
      duration={settings.duration}
      qualityPreset={settings.qualityPreset}
      bind:running
      bind:recording
      sizing={settings.sizing}
      customWidth={settings.width}
      customHeight={settings.height}
      on:progress={(v) => {
        progress = progress;
      }}
      on:load={({ detail: weave }) => {
        if (weave) {
          setBackground(weave.backgroundColor, true);
        } else setBackground(initialBackground, true);
      }}
      data={svg}
    />
  </div>
  <div class="content">
    <nav>
      <ToggleButton enabled={!recording} bind:value={showSettings}
        >{showSettings ? "^" : "v"}</ToggleButton
      >
      <ToggleButton enabled={!recording} bind:value={running}
        >{running ? "Pause" : "Play"}</ToggleButton
      >
      <ToggleButton bind:value={recording}
        >{recording ? "Stop" : "Record"}</ToggleButton
      >
      {#if showSettings}
        <Settings
          bind:duration={settings.duration}
          bind:fps={settings.fps}
          bind:qualityPreset={settings.qualityPreset}
          bind:resamplePaths={settings.resamplePaths}
          bind:sizing={settings.sizing}
          bind:width={settings.width}
          bind:height={settings.height}
        />
      {/if}
      {#if recording}
        <div>{progress}</div>
      {/if}
    </nav>
    <div class="info">
      <p>
        Drag and drop a <a target="_blank" href="https://iorama.studio/"
          >Looom</a
        >
        SVG file into this window to view it. Export features still WIP.
      </p>
      <p>
        Web renderer by <a href="https://twitter.com/mattdesl" target="_blank"
          >@mattdesl</a
        >.
      </p>
    </div>
  </div>
</main>

<style>
  .canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  a {
    color: currentColor;
    font-weight: 600;
  }
  p {
    margin: 0;
    padding: 0;
    line-height: 1.5;
  }
  main {
    color: currentColor;
    line-height: 1.5;
    font-size: 12px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
  nav {
    height: 32px;
    width: 100%;
  }
  .info {
    padding: 20px;
  }
  .content {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    align-items: flex-start;
  }
</style>
