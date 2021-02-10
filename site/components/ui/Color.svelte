<script>
  import Prop from "./Prop.svelte";
  import Color from "canvas-sketch-util/color";
  // import {HsvPicker} from 'svelte-color-picker';

  export let label = "Color";
  export let value = "#000000";
  let inputValue;
  $: value, update();

  function update() {
    const parsed = Color.parse(value);
    if (parsed) {
      inputValue = parsed.hex;
    } else {
      console.warn(`Could not parse color value ${value}`);
      inputValue = "#000000";
    }
  }

  function input(ev) {
    value = ev.target.value;
  }
</script>

<style>
  input {
    cursor: pointer;
    -webkit-appearance: none;
    border: none;
    background: none;
    border-radius: 5px;
    padding: 0;
    overflow: hidden;
    width: 50px;
    height: 25px;
    outline: 0;
    box-sizing: border-box;
    border: 1px solid #dcdcdc;
    padding: 0;
    margin: 0;
  }
  input:focus,
  input:active {
    box-shadow: 0 0 4px 2px #93c3da;
  }

  input[type="color"]::-webkit-color-swatch-wrapper {
    border: 0;
    padding: 0;
  }
  input[type="color"]::-webkit-color-swatch {
    border: none;
    border: 2px solid white;
    border-radius: 5px;
  }
</style>

<Prop {label}><input type="color" value={inputValue} on:input={input} /></Prop>
