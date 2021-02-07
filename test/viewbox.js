const canvasSketch = require("canvas-sketch");
const { mat2d } = require("gl-matrix");

const settings = {
  dimensions: [1024, 768],
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    context.save();

    const viewBox = `-512 0 2048 768`.split(" ").map((n) => parseInt(n, 10));
    const viewport = { width, height };
    const viewBox = { width: viewBox[2], height: viewBox[3] };
    context.translate(-viewBox[0], -viewBox[1]);
    // context.translate(viewBox[2] / 2, 0);

    context.strokeStyle = "blue";
    context.strokeRect(-512, 0, width, height);

    context.beginPath();
    context.lineWidth = 10;
    context.arc(-512, 50, 10, 0, Math.PI * 2);
    context.strokeStyle = "red";
    context.stroke();

    context.restore();
  };
};

canvasSketch(sketch, settings);
