<script>
  import Button from "./Button.svelte";
  import { saveFile, getTimeStamp } from "../util/save";
  import dragDrop from "drag-drop";
  import { onMount } from "svelte";
  import Prop from "./Prop.svelte";
  import FileInput from "./dom/FileInput.svelte";
  import DropContainer from "./DropContainer.svelte";

  export let node;

  function readJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const txt = ev.target.result;
        try {
          resolve(JSON.parse(txt));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () =>
        reject(new Error(`Could not load file ${file.name}`));
      reader.readAsText(file);
    });
  }

  function save() {
    if (!node) return;
    const name = node.name;
    const props = node.getState();
    const data = { name, props };
    saveFile(JSON.stringify(data), {
      filename: [name, getTimeStamp()].join("-") + ".json",
    });
  }

  function input(ev) {
    file(ev.target.files);
  }

  function drop({ detail }) {
    const { files } = detail;
    file(files);
  }

  async function file(files) {
    if (!files || files.length === 0 || !files[0]) {
      return;
    }
    if (files.length === 0) return alert("No files dropped");
    else if (files.length > 1) return alert("Drop just one JSON file");
    else {
      const f = files[0];
      if (f.type !== "application/json") {
        return alert(`${f.name} is not a JSON settings file`);
      }
      try {
        const data = await readJSON(f);
        if (node && data && data.props) {
          let allow = true;
          if (data.name !== node.name) {
            allow = window.confirm(
              `WARN: You are dropping "${data.name}" settings onto "${node.name}" config, which might cause issues. Continue?`
            );
          }
          if (allow) node.setState(data.props);
        }
      } catch (err) {
        alert(err.message);
      }
    }
  }
</script>

<DropContainer on:drop={drop}>
  <Button label="Save Settings" on:click={save} />
  <Prop label={false}>
    <FileInput
      text="Select / Drop JSON Settings File"
      accept="application/json"
      expand
      on:input={input} />
  </Prop>
</DropContainer>
