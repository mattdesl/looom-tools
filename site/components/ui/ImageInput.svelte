<script>
  import { onMount, createEventDispatcher } from "svelte";
  import { Prop } from "./";
  import DropContainer from "./DropContainer.svelte";
  import objectFit from "../util/objectFit";
  import FileInput from "./dom/FileInput.svelte";

  export let label = "Image";
  export let text = "Select / Drop Image";

  const types = [
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "image/tiff",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/apng",
  ];

  function clear(node) {
    while (node.lastChild) {
      node.removeChild(node.lastChild);
    }
  }

  const dispatcher = createEventDispatcher();

  let value = undefined;
  let canvas, context;
  let dropContainer;

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error(`Error loading file as image ${file.name}`));
        img.src = reader.result;
      };
      reader.onerror = () =>
        reject(new Error(`Error loading file ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  onMount(() => {
    context = canvas.getContext("2d");
    updateCanvas();
    return () => {
      if (imageContainer) clear(imageContainer);
    };
  });

  async function drop({ detail }) {
    const { files } = detail;
    loadFile(files);
  }

  async function loadFile(files) {
    if (!files || files.length === 0 || !files[0]) {
      return;
    }
    if (files.length === 0) return alert("No files dropped");
    else if (files.length > 1) return alert("Drop just one image file");
    else {
      const f = files[0];
      if (!types.includes(f.type)) {
        return alert(`${f.name} is not an image file type (PNG, JPG, etc)`);
      }
      try {
        const image = await readImage(f);
        value = image;
        imageChanged();
      } catch (err) {
        alert(err.message);
      }
    }
  }

  function load(files) {
    loadFile(files);
  }

  function imageChanged() {
    updateCanvas();
    dispatcher("change", value);
  }

  function updateCanvas() {
    const width = 25;
    const height = 25;
    const dpr = window.devicePixelRatio;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.save();
    context.scale(dpr, dpr);
    context.clearRect(0, 0, width, height);
    const image = value;
    if (value) {
      const [tx, ty, tw, th] = objectFit({
        parentWidth: width,
        parentHeight: height,
        childWidth: image.width,
        childHeight: image.height,
        fit: "cover",
      });
      context.drawImage(image, tx, ty, tw, th);
    } else {
      context.beginPath();
      context.rect(0, 0, width, height);
      context.moveTo(0, 0);
      context.lineTo(width, height);
      context.strokeStyle = "hsl(0, 0%, 20%)";
      context.lineWidth = 1;
      context.stroke();
    }
    context.restore();
  }

  function input(ev) {
    load(ev.target.files);
  }
</script>

<style>
  .image-container {
    width: 25px;
    height: 25px;
    border-radius: 5px;
    overflow: hidden;
    margin-left: 5px;
  }
</style>

<DropContainer on:drop={drop}>
  <Prop {label}>
    <FileInput
      active={value != null}
      {text}
      accept="image/*"
      on:input={input} />
    <div class="image-container">
      <canvas bind:this={canvas} />
    </div>
  </Prop>
</DropContainer>
