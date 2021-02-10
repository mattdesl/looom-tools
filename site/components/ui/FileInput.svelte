<script>
  import Button from "./Button.svelte";
  import { saveFile, getTimeStamp } from "../util/save";
  import dragDrop from "drag-drop";
  import { onMount, createEventDispatcher } from "svelte";
  import Prop from "./Prop.svelte";
  import FileInput from "./dom/FileInput.svelte";
  import DropContainer from "./DropContainer.svelte";

  const dispatcher = createEventDispatcher();

  export let text = "Select / Drop File";
  export let multiple = false;

  function handleFiles(files) {
    dispatcher("select", files);
  }

  function input(ev) {
    handleFiles(ev.target.files);
  }

  function drop({ detail }) {
    const { files } = detail;
    handleFiles(files);
  }
</script>

<DropContainer on:drop={drop}>
  <Prop label={false}>
    <FileInput {text} {multiple} on:input={input} expand />
  </Prop>
</DropContainer>
