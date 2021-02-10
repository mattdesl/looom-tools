<script>
  import Prop from "./Prop.svelte";
  import NumberInput from "./dom/NumberInput.svelte";
  export let label = "";

  const presets = {
    array: { separator: "", components: [] },
    vector: { separator: ",", components: ["X", "Y", "Z", "W"] },
    color: { separator: ",", components: ["R", "G", "B", "A"] },
    size: { separator: "×", components: ["W", "H", "D", "T"] },
  };

  export let separator = presets.vector.separator;
  export let components = presets.vector.components;
  export let type = "vector";
  export let readonly = false;

  export let x = undefined;
  export let y = undefined;
  export let z = undefined;
  export let w = undefined;
  export let min = undefined;
  export let max = undefined;
  export let step = undefined;
  export let draggable = true;

  export let units = undefined;
  export let unitTypes = [];

  let list;
  $: {
    if (type != null && typeof type === "string" && !(type in presets)) {
      throw new Error(`Unknown type preset ${type}`);
    }
    if (type && typeof type === "string") {
      const p = presets[type];
      separator = p.separator;
      components = p.components;
    } else if (type) {
      separator = type.separator || "";
      components = type.components || [];
    }
  }
</script>

<Prop {label}>
  <div class="value-container">
    {#if x != null}
      {#if components[0]}
        <label>{components[0]}</label>
      {/if}
      <NumberInput
        {draggable}
        {readonly}
        on:input={(ev) => (x = +parseFloat(ev.currentTarget.value))}
        bind:value={x}
        {min}
        {max}
        {step}
      />
      {#if separator && y != null}
        <span>{separator}</span>
      {/if}
    {/if}
    {#if y != null}
      {#if components[1]}
        <label>{components[1]}</label>
      {/if}
      <NumberInput
        {draggable}
        {readonly}
        on:input={(ev) => (y = +parseFloat(ev.currentTarget.value))}
        bind:value={y}
        {min}
        {max}
        {step}
      />
      {#if separator && z != null}
        <span>{separator}</span>
      {/if}
    {/if}
    {#if z != null}
      {#if components[2]}
        <label>{components[2]}</label>
      {/if}
      <NumberInput
        {draggable}
        {readonly}
        on:input={(ev) => (z = +parseFloat(ev.currentTarget.value))}
        bind:value={z}
        {min}
        {max}
        {step}
      />
      {#if separator && w != null}
        <span>{separator}</span>
      {/if}
    {/if}
    {#if w != null}
      {#if components[3]}
        <label>{components[3]}</label>
      {/if}
      <NumberInput
        {draggable}
        {readonly}
        on:input={(ev) => (w = +parseFloat(ev.currentTarget.value))}
        bind:value={w}
        {min}
        {max}
        {step}
      />
    {/if}
  </div>
  {#if units}
    <div class="unit-container">
      {#if unitTypes && unitTypes.length}
        <select class="unit-select" bind:value={units}>
          {#each unitTypes as item}
            <option value={item}>
              {item && item.name != null ? item.name : item}
            </option>
          {/each}
        </select>
      {:else}
        <label>{units}</label>
      {/if}
    </div>
  {/if}
</Prop>

<style>
  span {
    opacity: 0.25;
  }
  label,
  span {
    font-size: 10px;
    font-family: "Andale Mono", "Courier New", monospace;
  }
  label {
    margin-right: 5px;
    opacity: 0.5;
  }
  div {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: row;
  }
  .value-container,
  .unit-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: row;
  }
  span {
    padding-left: 5px;
    padding-right: 5px;
  }
  select {
    width: 100%;
    height: auto;
  }
  .value-container {
    flex-shrink: 1;
  }
  :global(.value-container input) {
    width: 100%;
  }
  .unit-container {
    padding-left: 10px;
    flex-grow: 0;
    flex-shrink: 2;
  }
  .unit-container select {
    min-width: 50px;
  }
</style>
