<script>
  import Prop from "./Prop.svelte";
  import NumberInput from "./dom/NumberInput.svelte";
  export let label = "";
  export let value = 0;
  export let min = undefined;
  export let max = undefined;
  export let step = undefined;
  export let readonly = false;
  export let round = true;
  export let draggable = true;
  export let fullWidth = false;
  $: {
    value, min, max;
    value = +parseFloat(value);
    if (min != null) value = Math.max(min, value);
    if (max != null) value = Math.min(max, value);
  }
</script>

<Prop {label}>
  <NumberInput
    {fullWidth}
    {draggable}
    {readonly}
    bind:value
    {round}
    {min}
    {max}
    {step}
  />
</Prop>
