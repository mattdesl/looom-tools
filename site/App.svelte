<script>
  // const parse = require("../src/parse-looom-svg");
  // const { createRenderer } = require("../src/canvas-rendering");

  import { fade } from "svelte/transition";
  import LooomCanvas from "./components/LooomCanvas.svelte";

  import Color from "canvas-sketch-util/color";
  import Random from "canvas-sketch-util/random";
  import dragDrop from "drag-drop";
  import splashSVG from "./splash.svg.js";
  import Settings from "./components/Settings.svelte";
  import Button from "./components/Button.svelte";
  import Progress from "./components/Progress.svelte";
  import { isWebCodecsSupported, isWebMSupported } from "./components/record";
  import { onMount } from "svelte";

  const hasMP4 = isWebCodecsSupported();
  const hasWebM = isWebMSupported();
  let formats = ["gif"];
  if (hasWebM) formats.push("webm");
  if (hasMP4) formats.push("mp4");

  const hasAllFormats = hasMP4 && hasWebM;

  const initialFormat = formats[0];

  let settings = {
    format: initialFormat,
  };

  let running = true;
  let recording = false;
  let showSettings = false;
  let progress = 0.0;
  let pass = 0;
  let totalPasses = 1;

  $: {
    if (recording) showSettings = false;
    else {
      progress = pass = 0;
      totalPasses = 1;
    }
  }

  let foreground, background;
  let initialBackground = "#FFD984";
  let svg;

  dragDrop(document.body, (files) => loadSVGFile(files[0]));
  setBackground(initialBackground);

  onMount(() => {
    if (!svg) svg = splashSVG;
  });

  async function loadSVGFile(file) {
    svg = await readFile(file);
  }

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
    // console.log("New background", color);
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
      format={settings.format}
      bind:running
      bind:recording
      sizing={settings.sizing}
      customWidth={settings.width}
      customHeight={settings.height}
      on:recordProgress={({ detail }) => {
        progress = detail.progress;
        totalPasses = detail.totalPasses;
        pass = detail.pass;
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
      <Button
        toggleable
        alt="Settings"
        color={foreground}
        enabled={!recording}
        bind:value={showSettings}
        svg={showSettings ? "settings-open" : "settings"}
      />

      <Button
        alt="Upload SVG File"
        input
        on:file={({ detail }) => loadSVGFile(detail)}
        color={foreground}
        svg="file-upload"
      />

      <Button
        alt="Toggle Play"
        toggleable
        color={foreground}
        enabled={!recording}
        bind:value={running}
        svg={running ? "player-pause" : "player-play"}
      />
      <Button
        alt="Toggle Record"
        toggleable
        color={foreground}
        bind:value={recording}
        svg={recording ? "player-recording" : "player-record"}
      />
      {#if recording}
        <Progress {progress} color={foreground} />
        {#if totalPasses > 1}
          <div class="pass">{pass + 1} / {totalPasses}</div>
        {/if}
      {/if}
    </nav>
    <div class="info">
      <div>
        <p>
          Drag and drop a <a target="_blank" href="https://iorama.studio/"
            >Looom</a
          >
          SVG file into this window to export it.
        </p>
      </div>
      <div>
        <p>
          Web renderer and exporter by <a
            href="https://twitter.com/mattdesl"
            target="_blank">@mattdesl</a
          >.
        </p>
      </div>
    </div>
  </div>
  {#if showSettings}
    <div
      transition:fade={{ duration: 150 }}
      class="settings-modal"
      on:click={(e) => {
        showSettings = false;
      }}
    >
      <div
        class="settings-popup"
        on:click={(e) => {
          e.stopPropagation();
        }}
      >
        <Settings
          bind:duration={settings.duration}
          bind:fps={settings.fps}
          bind:recenter={settings.recenter}
          bind:format={settings.format}
          {formats}
          showFormatInfo={!hasAllFormats}
          bind:qualityPreset={settings.qualityPreset}
          bind:resamplePaths={settings.resamplePaths}
          bind:sizing={settings.sizing}
          bind:width={settings.width}
          bind:height={settings.height}
        />
      </div>
    </div>
  {/if}
</main>

<style>
  .settings-modal {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.25);
  }
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
    padding: 10px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .info {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    justify-content: space-between;
    flex-direction: row;
    align-items: center;
    padding: 20px;
  }
  .settings-popup {
    display: block;
    position: absolute;
    top: 52px;
    left: 18px;
  }
  .pass {
    font-size: 10px;
    margin-left: 10px;
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
