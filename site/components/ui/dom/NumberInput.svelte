<script>
  import { onMount } from "svelte";
  import simpleInput from "simple-input-events";

  function roundToDecimals(value, decimals) {
    return Number(value.toFixed(decimals));
    // const dec = Number("1e-" + decimals);
    // if (value <= dec) return value;
    // return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
  }

  export let min = undefined;
  export let max = undefined;
  export let step = undefined;
  export let value = undefined;
  export let readonly = false;
  export let round = true;
  export let fullWidth = false;
  export let draggable = true;

  $: {
    if (min != null && isFinite(min)) {
      value = Math.max(value, min);
    }
    if (max != null && isFinite(max)) {
      value = Math.min(value, max);
    }
    if (round !== false) {
      const p =
        round != null && isFinite(round) && typeof round === "number"
          ? round
          : 5;
      value = roundToDecimals(value, p);
    }
  }

  let element;
  onMount(() => {
    let start = null;
    let locked = false;
    const clearLock = () => {
      if (locked) {
        const fn = document.exitPointerLock || document.mozExitPointerLock;
        fn.call(document);
        locked = false;
        element.blur();
      }
    };
    let input;
    if (draggable) {
      input = simpleInput({
        target: element,
        parent: window,
      });
      input.on("down", (ev) => {
        start = [ev.event.screenX, ev.event.screenY];
      });
      input.on("up", (ev) => {
        clearLock();
      });
      input.on("move", (ev) => {
        if (ev.dragging && start && !readonly) {
          if (!locked) {
            const fn =
              element.requestPointerLock || element.mozRequestPointerLock;
            fn.call(element);
            locked = true;
          }
          if (ev.event.movementY != null) {
            let factor = 1;
            if (ev.event.shiftKey) factor *= 10;
            else if (step < 1 && (ev.event.metaKey || ev.event.ctrlKey))
              factor *= 0.1;
            const pixelsToSize = ev.event.movementY * step;
            value -= pixelsToSize * factor;
          }
        }
      });
    }

    return () => {
      if (input) input.disable();
      clearLock();
    };
  });
</script>

{#if readonly}
  <label class="input readonly" title={value}>{value}</label>
{:else}
  <input
    title={value}
    class="input"
    class:draggable
    class:fullWidth
    on:input
    on:change
    bind:this={element}
    type="number"
    bind:value
    {min}
    {max}
    {step}
  />
{/if}

<style>
  input,
  label {
    font-family: "SilkaMono", "Andale Mono", "Courier New", monospace;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    text-align: right;
    min-width: 50px;
    width: initial;
    height: auto;
    border-radius: 2px;
    padding-left: 5px;
    padding-top: 5px;
    padding-bottom: 5px;
    /* min-width: 60px; */
    border: 1px solid #c5c5c5;
    background: transparent;
    font-size: 12px;

    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  input:hover {
    border: 1px solid #a0a0a0;
  }
  .fullWidth {
    width: 100%;
  }
  .draggable {
    cursor: ns-resize;
  }
  .autowidth {
  }
  .readonly {
    padding-left: 5px;
    padding-right: 5px;
    /* min-width: 50px; */
    /* width: initial; */
    cursor: default;

    border: 1px solid hsl(0, 0%, 95%);
  }
</style>
