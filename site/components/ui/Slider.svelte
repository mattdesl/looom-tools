<script>
  import Prop from "./Prop.svelte";
  import NumberInput from "./dom/NumberInput.svelte";
  export let value;
  export let min = 0;
  export let max = 1;
  export let step = 0.01;
  export let label = "Slider";
  $: {
    if (min != null && isFinite(min)) {
      value = Math.max(value, min);
    }
    if (max != null && isFinite(max)) {
      value = Math.min(value, max);
    }
  }
</script>

<style>
  input {
    box-sizing: border-box;
    margin-right: 10px;
    width: 100%;
  }

  .slider {
    -webkit-appearance: none;
    min-width: 200px;
    max-width: 200px;
    height: 25px;
    background: rgba(255, 255, 255, 0.15);
    padding: 20.5px 10px 18.5px 10px;
    border-radius: 10px;
    outline: none;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15.52px;
    height: 15.52px;
    background: #fff;
    border-radius: 100%;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 25px;
    height: 25px;
    background: #4caf50;
    cursor: pointer;
  }
</style>

<!-- <Prop> -->
<input type="range" class="slider" bind:value {min} {max} {step} />
<!-- <NumberInput bind:value {min} {max} {step} /> -->
<!-- </Prop> -->
