<script>
  // const parse = require("../src/parse-looom-svg");
  // const { createRenderer } = require("../src/canvas-rendering");

  import LooomCanvas from "./LooomCanvas.svelte";

  import Color from "canvas-sketch-util/color";
  import Random from "canvas-sketch-util/random";
  import dragDrop from "drag-drop";
  import initialSVGUrl from "../test/fixtures/Earthy1.svg";
  import Settings from "./Settings.svelte";

  let settings = {
    // width: 1024,
    // height: 768,
    // sizing: "custom",
    // recenter: false,
    // resamplePaths: false,
    // duration: 4,
    // fps: 30,
    // running: false,
    // format: "gif", // json, mp4, gif, png, jpg
    // preset: "high",
  };

  let showSettings = true;
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
      bind:resamplePaths={settings.resamplePaths}
      bind:running={settings.running}
      bind:sizing={settings.sizing}
      bind:customWidth={settings.width}
      bind:customHeight={settings.height}
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
      <button>SETTINGS</button>
      <button>RECORD</button>
      {#if showSettings}
        <Settings
          bind:resamplePaths={settings.resamplePaths}
          bind:running={settings.running}
          bind:sizing={settings.sizing}
          bind:customWidth={settings.width}
          bind:customHeight={settings.height}
        />
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
