<script>
  import { onMount } from "svelte";
  import simpleInput from "simple-input-events";

  export let value = undefined;
  export let readonly = false;
</script>

<style>
  input,
  label {
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    min-width: 50px;
    height: auto;
    border-radius: 2px;
    padding-left: 5px;
    padding-top: 5px;
    padding-bottom: 5px;
    min-width: 50px;
    border: 1px solid #c5c5c5;
    background: transparent;
    font-size: 12px;
    font-family: "SilkaMono", "Andale Mono", "Courier New", monospace;
  }
  input:hover {
    border: 1px solid #a0a0a0;
  }
  .readonly {
    padding-left: 5px;
    padding-right: 5px;
    /* min-width: 50px; */
    width: initial;
    border: 1px solid hsl(0, 0%, 95%);
  }
</style>

{#if readonly}
  <label class="input readonly">{value}</label>
{:else}
  <input class="input" on:input on:change type="text" bind:value />
{/if}
