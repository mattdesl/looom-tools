<script>
  import Prop from "./Prop.svelte";
  import Button from "./dom/Button.svelte";

  // export let padLeft = false;
  export let accelerator = "";
  export let label = "";
</script>

<Prop label={false}>
  <Button
    {label}
    {accelerator}
    on:click
    on:mousedown
    on:mouseup
    on:touchend
    on:touchstart />
</Prop>
