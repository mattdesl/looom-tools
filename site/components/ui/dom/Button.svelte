<script>
  import { onMount } from "svelte";

  export let label = "";
  export let accelerator = "";

  function splitAccelerator() {
    if (!accelerator) return [];
    const idx = label.toLowerCase().indexOf(accelerator.toLowerCase());
    if (idx >= 0) {
      return [
        { text: label.substring(0, idx) },
        { text: label.charAt(idx), highlight: true },
        { text: label.substring(idx + 1) },
      ].filter((s) => s.text.length);
    } else {
      return [{ text: label }, { text: ` (${accelerator})`, highlight: true }];
    }
  }

  let element;
  onMount(() => {
    const listener = (ev) => {
      if (!ev.altKey) return;
      if (accelerator) {
        const a = String(accelerator).toLowerCase();
        const k = String.fromCharCode(ev.keyCode).toLowerCase();
        if (k === a) {
          element.click();
          ev.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  });
</script>

<style>
  button {
    margin: 5px 0px;
    font: inherit;
    width: 100%;
    display: block;
    text-align: left;
    margin: 0;
    padding: 7px 10px;
    border-radius: 7px;
    background: white;
    outline: 0;
    border: 1px solid hsl(0, 0%, 20%);
    cursor: pointer;
    /* box-shadow: 2px 2px 5px -1px rgba(0, 0, 0, 0.1); */
  }
  .highlight {
    text-decoration: underline;
  }
  button:hover {
    background: hsl(0, 0%, 95%);
  }
  button:active {
    background: white;
  }
</style>

<button
  bind:this={element}
  on:click
  on:mousedown
  on:mouseup
  on:touchend
  on:touchstart>
  {#if accelerator}
    {#each splitAccelerator() as item}
      <span class:highlight={item.highlight}>{item.text}</span>
    {/each}
  {:else}{label}{/if}
</button>
