<script>
  import { fly } from "svelte/transition";

  import Checkbox from "./ui/Checkbox.svelte";
  import NumberSpinner from "./ui/Number.svelte";
  import Prop from "./ui/Prop.svelte";
  import Select from "./ui/Select.svelte";
  import Vector from "./ui/Vector.svelte";
  // {
  //   width: 1024,
  //   height: 768,
  //   sizing: "custom",
  //   recenter: false,
  //   resamplePaths: false,
  //   duration: 4,
  //   fps: 30,
  //   running: false,
  //   format: "gif", // json, mp4, gif, png, jpg
  //   preset: "high",
  // };
  export let recenter = false;
  export let resamplePaths = false;
  export let transparentBackground = false;
  export let quantizeWithAlpha = false;
  export let width = 1024;
  export let height = 768;
  export let sizing = "weave";
  export let showFormatInfo = true;
  export let formats = ["mp4", "gif"];
  export let format = "mp4";

  // for movie
  export let duration = 5;
  export let fps = 30;
  export let qualityPreset = "high";

  // for still
  export let time = 0;
</script>

<!-- 
      <Select
      label="Quality"
      bind:value={qualityPreset}
      options={["high", "medium", "low"]}
    /> -->

<div
  class="settings"
  transition:fly={{
    y: -10,
    duration: 250,
  }}
>
  <!-- <header>Export Settings</header> -->
  <Checkbox label="Resample Paths" bind:value={resamplePaths} />
  <Checkbox label="Recenter" bind:value={recenter} />
  <Select
    label="Size Mode"
    bind:value={sizing}
    options={[
      { value: "weave", name: "Same as Weave" },
      { value: "window", name: "Fit to Window" },
      { value: "custom", name: "Custom" },
    ]}
  />
  {#if sizing === "custom"}
    <Vector
      type="size"
      label="Dimensions"
      min={1}
      max={4096 * 4}
      step={1}
      draggable={false}
      bind:x={width}
      bind:y={height}
      units="px"
    />
  {/if}
  <Select label="Format" bind:value={format} options={formats} />
  {#if showFormatInfo}
    <Prop>
      <div class="format-info">
        See <a
          target="_blank"
          href="https://github.com/mattdesl/looom-tools/blob/main/docs/formats.md"
          >here</a
        > for enabling other video formats.
      </div>
    </Prop>
  {/if}
  <Vector
    type="array"
    label="Duration"
    min={0.5}
    draggable={false}
    max={50000}
    step={0.1}
    units="seconds"
    bind:x={duration}
  />
  <NumberSpinner
    draggable={false}
    label="FPS"
    min={1}
    max={format === "gif" ? 50 : 60}
    step={1}
    bind:value={fps}
  />
  {#if format !== "mp4" && format !== "webm"}
    <Checkbox
      label="Transparent Background"
      bind:value={transparentBackground}
    />
    {#if format === "gif" && transparentBackground}
      <Checkbox label="Alpha Quantization" bind:value={quantizeWithAlpha} />
    {/if}
  {/if}
</div>

<!-- 
      <Select
      label="Quality"
      bind:value={qualityPreset}
      options={["high", "medium", "low"]}
    /> -->
<style>
  .format-info {
    color: black;
    margin-top: -10px;
    font-size: 10px;
  }
  .format-info a {
    color: black;
    font-weight: 600;
  }
  .settings {
    color: black;
    position: relative;
    width: 300px;
    /* height: 400px; */
    border-radius: 5px;
    overflow: hidden;
    padding: 20px;
    background: white;
  }
</style>
