<script>
  export let value = false;
  export let enabled = true;
</script>

<button
  disabled={!enabled}
  on:click={() => {
    value = !value;
  }}
>
  <slot />
</button>

<style>
  select {
    /* background: rgba(255, 255, 255, 0.15); */
    /* padding: 10px 20px 10px 20px; */
    /* appearance: none; */
    /* border-radius: 10px; */
    /* border: none; */
    /* margin-bottom: 11px; */
    /* min-width: 200px; */
    /* max-width: 200px; */
    /* color: #fff; */
    /* outline: none; */
  }
</style>
