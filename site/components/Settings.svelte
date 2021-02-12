<script>
  import { fly } from "svelte/transition";

  import Checkbox from "./ui/Checkbox.svelte";
  import NumberSpinner from "./ui/Number.svelte";
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
  export let width = 1024;
  export let height = 768;
  export let sizing = "weave";
  export let recording = false;
  export let formats = ["mp4", "gif"];
  export let format = "mp4";

  // for movie
  export let duration = 5;
  export let fps = 30;
  export let qualityPreset = "high";

  // for still
  export let time = 0;
</script>

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
  {#if formats.includes(format)}
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
      max={60}
      step={1}
      bind:value={fps}
    />
    <Select
      label="Quality"
      bind:value={qualityPreset}
      options={["high", "medium", "low"]}
    />
  {:else}
    <Vector
      type="array"
      label="Time"
      min={0.0}
      max={50000}
      step={0.1}
      units="seconds"
      bind:x={time}
    />
  {/if}
</div>

<style>
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
