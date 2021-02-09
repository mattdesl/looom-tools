<script>
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
  export let width = 1024;
  export let height = 768;
  export let sizing = "custom";
  $: console.log(sizing);
</script>

<div class="settings">
  <div class="row">
    <span>Size Mode:</span>
    <select>
      <option>Same as Weave</option>
      <option>Fit to Window</option>
      <option>Custom</option>
    </select>
    {#if sizing === "custom"}
      <div class="custom-size">
        <input
          type="number"
          min={2}
          step={1}
          max={4096 * 4}
          bind:value={width}
        />
        <span>×</span>
        <input
          type="number"
          step={1}
          min={2}
          max={4096 * 4}
          bind:value={height}
        />
        <span>px</span>
      </div>
    {/if}
  </div>
</div>
