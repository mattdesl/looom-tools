<script>
  import Prop from "./Prop.svelte";

  export let label = "";
  export let options = [];
  export let value = undefined;
</script>

<style>
  select {
    width: initial;
    height: auto;
  }
</style>

<Prop {label}>
  <select bind:value on:change>
    {#each options as item}
      <option value={item && item.value != null ? item.value : item}>
        {item && item.name != null ? item.name : item}
      </option>
    {/each}
  </select>
</Prop>
