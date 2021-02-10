<script context="module">
  import { setContext, getContext } from "svelte";
  const CONTEXT = {};
</script>

<script>
  import openSVG from "../assets/image/svg/keyboard_arrow_right-24px.svg";
  import closeSVG from "../assets/image/svg/keyboard_arrow_down-24px.svg";
  import { onMount } from "svelte";

  export let label = "Folder";
  export let id = label;

  const parent = getContext(CONTEXT);
  let ids = [];
  const state = { id, children: [], parent };
  let node = state.parent;
  while (node) {
    ids.unshift(node.id);
    node = node.parent;
  }
  if (parent) {
    state.id = getNextQualifiedName(state.id, parent.children);
    parent.children.push(state.id);
  }
  ids.push(state.id);
  setContext(CONTEXT, state);

  const key = `folder-state-${ids.join("-")}`;

  function getNextQualifiedName(id, siblings) {
    let count = 1;
    while (siblings.includes(id)) {
      const nosuffix = id.replace(/\_[\d]+$/, "");
      id = `${nosuffix}_${count}`;
      count++;
    }
    return id;
  }

  export let headless = false;
  export let open = true;
  let isOpen = open;

  let openState = window.localStorage.getItem(key);
  if (openState === "true" || openState === "false") {
    isOpen = openState === "true";
  }

  let mounted = false;
  onMount(() => {
    mounted = true;
  });
  $: {
    mounted && window.localStorage.setItem(key, String(Boolean(isOpen)));
  }

  export let expandable = true;

  let hasChildren = Boolean(arguments[1].$$slots);

  function handleOpen(ev) {
    if (!expandable) return;
    ev.preventDefault();
    isOpen = !isOpen;
  }
</script>

<style>
  .children {
    padding: 5px;
    padding-right: 0px;
    /* margin-right: 10px; */
    box-sizing: border-box;
    /* padding-left: 5px; */
    /* padding-right: 5px; */
    /* padding-left: 0px; */
    /* padding-top: 5px; */
    /* padding-bottom: 5px; */
    /* padding-top: 5px; */
    /* padding-bottom: 5px; */
    /* border-left: 5px solid hsl(0, 0%, 90%); */
    /* border-bottom: 1px solid hsl(0, 0%, 90%); */
  }
  .children > .folder > .children {
    /* padding: 0px; */
  }
  .children:not(:empty) {
    /* padding: 5px; */
  }
  .folder {
    /* margin-top: 5px;
    margin-bottom: 5px; */
    box-sizing: border-box;
    /* padding: 0px; */
    /* padding-right: 0px; */
    width: 100%;
  }
  .folder:not(:first-child) {
    margin-top: 10px;
  }
  .folder:not(:last-child) {
    margin-bottom: 10px;
  }
  .children > .folder {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    border: 1px solid hsl(0, 0%, 90%);
    border-right: none;
    /* margin: 0px; */
    /* margin-bottom: 0px; */
    /* border-left: 5px solid hsl(0, 0%, 90%); */
    /* padding-left: 0px; */
    /* padding-left: 5px; */
    /* padding-right: 5px; */
    /* padding: 5px; */
    /* border-radius: 5px; */
    /* border-top: 1px solid blue; */
    /* border-bottom: 1px solid blue; */
  }
  .folder:first-child {
    /* margin-top: 0; */
  }
  .children:not(.open) {
    display: none;
  }
  /* .children >  */
  .folder {
    overflow: hidden;
    box-sizing: border-box;
  }
  /* .children >  */
  .folder:not(:first-child) {
    /* margin-top: 10px; */
  }
  .folder:not(:first-child) {
    /* margin-top: 10px; */
  }
  .folder:not(:last-child) {
    /* margin-bottom: 10px; */
  }
  .children > *:not(:first-child) {
  }
  label {
    margin-bottom: 0px;
    display: block;
    cursor: inherit;
  }
  header {
    box-sizing: border-box;
    padding: 6px 10px;
    font-weight: 500;
    display: flex;
    font-size: 12px;
    font-family: inherit;
    justify-content: space-between;
    background: hsl(0, 0%, 90%);

    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none;
  }
  .empty-expander {
    width: 16px;
    height: 16px;
    padding: 5px;
    border-radius: 5px;
    box-sizing: border-box;
    margin-right: 5px;
  }
  header.hasChildren.expandable {
    cursor: pointer;
  }
  .open > header.hasChildren {
    /* margin-bottom: 2.5px; */
  }
  .expander {
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border-radius: 5px;
    margin: 0;
    border: 0;
    padding: 5px;
    margin-right: 5px;
    outline: 0;
    background-repeat: no-repeat;
    background-size: 16px 16px;
    background-color: hsla(0, 0%, 80%, 0);
  }
</style>

<div class="folder" class:open={isOpen} class:headless>
  {#if !headless}
    <header on:click={handleOpen} class:hasChildren class:expandable>
      {#if label}<label>{label}</label>{:else}<label />{/if}
      {#if hasChildren && expandable}
        <figure
          class="expander"
          style="background-image: url({isOpen ? closeSVG : openSVG})" />
      {:else}
        <div class="empty-expander" />
      {/if}
    </header>
  {/if}
  {#if isOpen}
    <div class="children" class:open={isOpen && hasChildren}>
      <slot />
    </div>
  {/if}
</div>
