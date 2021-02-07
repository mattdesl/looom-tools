const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  const mask = createContext();
  const children = createContext();

  return (props) => {
    const {
      context,
      width,
      height,
      scaleX,
      scaleY,
      canvasWidth,
      canvasHeight,
    } = props;
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    context.translate(200, 200);

    // render layer into main buffer
    renderMaskLayer(props);
    renderToMask(props, mask);

    // for mask layer:
    // draw itself into main buffer + bitmask buffer
    // then all children get drawn into a second canvas
    // and then we clip when drawing the second canvas
    // with the bitmask of the mask layer

    children.canvas.width = canvasWidth;
    children.canvas.height = canvasHeight;
    children.context.save();
    children.context.resetTransform();
    children.context.setTransform(context.getTransform());
    children.context.strokeStyle = "pink";
    children.context.lineWidth = 90;
    children.context.strokeRect(
      width / 2,
      height / 6,
      width * 0.125,
      height * 0.6
    );
    children.context.restore();

    // Each thread gets its own canvas

    const oldTransform = context.getTransform();
    context.resetTransform();
    context.clearRect(0, 0, width, height);

    context.globalCompositeOperation = "source-over";
    context.drawImage(mask.canvas, 0, 0, width, height);

    context.globalCompositeOperation = "source-out";
    context.drawImage(children.canvas, 0, 0, width, height);
    context.globalCompositeOperation = "source-over";

    context.setTransform(oldTransform);
  };

  function createContext() {
    const canvas = document.createElement("canvas");
    return {
      canvas,
      context: canvas.getContext("2d"),
    };
  }

  function renderToMask(props, mask) {
    mask.canvas.width = props.canvasWidth;
    mask.canvas.height = props.canvasHeight;
    mask.context.resetTransform();
    mask.context.setTransform(props.context.getTransform());
    renderMaskLayer({ ...props, context: mask.context }, true);
  }

  function renderMaskLayer({ context, width, height }, isMaskMode = false) {
    const maskFG = "black";
    const maskBG = "white";
    // if (isMaskMode) {
    //   context.fillStyle = maskBG;
    //   context.fillRect(0, 0, width, height);
    // }

    context.beginPath();
    context.lineWidth = 50;
    context.arc(width / 2, height / 2, width / 4, 0, Math.PI * 2);
    context.strokeStyle = isMaskMode ? "black" : "red";
    context.stroke();

    context.beginPath();
    context.lineWidth = 50;
    context.arc(width / 2, height / 2, width / 6, 0, Math.PI * 2);
    context.fillStyle = isMaskMode ? "black" : "blue";
    context.fill();
  }
};

canvasSketch(sketch, settings);
