<script>
  import Button from "./Button.svelte";
  import { getNode } from "../editor/nodes";
  import { onMount } from "svelte";
  import Select from "./Select.svelte";

  export let presets = [];

  const node = getNode();
  let value;

  function change(ev) {
    node.setState(value);
  }
</script>

<Select bind:value label="Set Preset:" options={presets} on:change={change} />
