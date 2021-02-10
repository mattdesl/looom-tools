<script context="module">
  import { getContext } from "svelte";
  const CONTEXT_KEY = {};
  export function getDropStore() {
    return getContext(CONTEXT_KEY);
  }
</script>

<script>
  import { setContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import dragDrop from "drag-drop";

  let _internalState = false;
  const dragStore = writable(_internalState);
  setContext(CONTEXT_KEY, dragStore);

  onMount(() => {
    const detach = dragDrop(document.body, {
      onDrop: (files, pos, fileList, directories) => {},
      onDragEnter: () => {
        if (_internalState !== true) {
          _internalState = true;
          dragStore.update(() => true);
        }
      },
      onDragOver: () => {
        if (_internalState !== true) {
          _internalState = true;
          dragStore.update(() => true);
        }
      },
      onDragLeave: () => {
        if (_internalState !== false) {
          _internalState = false;
          dragStore.update(() => false);
        }
      },
    });
    return () => detach();
  });
</script>

<slot />
