<script>
  export let label = "";
</script>

<div class="prop">
  {#if typeof label === "string"}
    <label title={label}>{label}</label>
  {:else if label === true}<label />{/if}
  <div class="prop-wrapper">
    <slot />
  </div>
</div>

<style>
  .prop {
    width: 100%;
    box-sizing: border-box;
    padding: 0px;
    /* background: blue;
    border-bottom: 1px solid red; */
    display: flex;
    padding: 5px 5px;
    justify-content: flex-start;
    align-items: center;
    min-height: 25px;
    font-size: 11px;
  }
  .prop:first-child {
    /* margin-top: 5px; */
  }
  .prop:last-child {
    /* padding-bottom: 0; */
  }
  .prop-wrapper {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-shrink: 1;
    flex-grow: 1;
    /* flex-basis: 50%; */
    /* max-width: 50%; */
    box-sizing: border-box;
  }
  label {
    flex-shrink: 1;
    flex-grow: 1;
    width: 80px;
    max-width: 80px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: black;
    padding-right: 10px;
    /* flex-basis: 30%; */
    text-align: right;
    box-sizing: border-box;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
