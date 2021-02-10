<script>
  import Prop from "./Prop.svelte";
  import TextInput from "./dom/TextInput.svelte";
  import Button from "./dom/Button.svelte";
  import Random from "canvas-sketch-util/Random";

  export let label = "Random Seed";
  export let value = getHash();
  export let readonly = false;

  function randomize() {
    value = getHash();
  }

  function dec2hex(dec) {
    return dec < 10 ? "0" + String(dec) : dec.toString(16);
  }

  function getHash() {
    const len = 12;
    const arr = new Uint8Array(len / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join("");
  }
</script>

<style>
  .spacer {
    content: " ";
    flex-basis: 10px;
    height: 100%;
    display: block;
  }
</style>

<Prop {label}>
  <TextInput bind:value {readonly} />
  <div class="spacer" />
  <Button label="Randomize" accelerator="a" on:click={randomize} />
</Prop>
