<script>
  import { onMount, createEventDispatcher } from "svelte";
  import dragDrop from "drag-drop";
  import { getDropStore } from "./DropRoot.svelte";
  let dispatcher = createEventDispatcher();

  let curStore = getDropStore();
  let active = false;
  let over = false;
  if (curStore) {
    curStore.subscribe((v) => {
      active = v;
    });
  }
  let dropTarget;
  onMount(() => {
    const detach = dragDrop(dropTarget, {
      onDrop: (files, pos, fileList, directories) => {
        dispatcher("drop", { files, pos, fileList, directories });
      },
      onDragEnter: () => {
        over = true;
      },
      onDragOver: () => {
        over = true;
      },
      onDragLeave: () => {
        over = false;
      },
    });
    return () => detach();
  });
</script>

<style>
  .drop-target {
    box-sizing: border-box;
    border: 2px solid transparent;
    padding: 1px 0;
    margin: 1px;
    border-radius: 5px;
  }
  .active {
    /* #0b34b9 */
    border: 2px dashed hsl(237deg 34% 73%);
  }
  .over {
    border: 2px dashed #0b34b9;
  }
</style>

<div
  class="drop-target"
  class:active={active || over}
  class:over
  bind:this={dropTarget}>
  <slot />
</div>
