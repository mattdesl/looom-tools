<script>
  import Prop from "./Prop.svelte";

  export let label = "";

  export let value = false;
  export let readonly = false;
  export let separateLabel = false;

  let disabled;
  $: disabled = readonly ? "disabled" : undefined;
</script>

<Prop label={separateLabel ? label : true}>
  <div>
    {#if label}
      <label class:separateLabel>
        <input type="checkbox" {disabled} bind:checked={value} on:change />
        {separateLabel ? "" : label}
      </label>
    {:else}
      <input type="checkbox" {disabled} bind:checked={value} on:change />
    {/if}
  </div>
</Prop>
{#if value}
  <slot />
{/if}

<style>
  div {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    width: 100%;
    height: auto;
    flex-direction: row;
  }
  label {
    user-select: none;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    width: 100%;
    height: auto;
    font-size: inherit;
    padding: 2.5px 10px;
    border-radius: 7px;
    box-sizing: border-box;
    background: hsl(0, 0%, 95%);
  }
  .separateLabel {
    padding-left: 0;
    background: initial;
  }
  /* label:hover {
    background: hsl(0, 0%, 90%);
  } */
  input {
    box-sizing: border-box;
    margin: 0;
    width: 100%;
    cursor: pointer;
  }
  label input {
    margin: 5px;
    margin-left: 0;
    width: initial;
  }
</style>
