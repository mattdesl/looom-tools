const canvasSketch = require("canvas-sketch");
const parse = require("../src/parse-looom-svg");
const createInputEvents = require("simple-input-events");
const { createRenderer } = require("../src/canvas-rendering");

const palettes = require("chromotome")
  .getAll()
  .map((c) => c.colors)
  .filter((c) => c.length >= 3);
const Random = require("canvas-sketch-util/random");
Random.setSeed("" || Random.getRandomSeed());
console.log(Random.getSeed());
const math = require("canvas-sketch-util/math");
const { mat2d, vec2 } = require("gl-matrix");

const settings = {
  suffix: Random.getSeed(),
  // dimensions: [1080, 1080],
  // fps: 60,
  // playbackRate: "throttle",
  animate: true,
  playing: true,
};

const sketch = async (props) => {
  const { update, canvas } = props;
  const resp = await fetch("test/fixtures/Earthy1.svg");
  const svgText = await resp.text();
  const weave = parse(svgText);
  const renderWeave = createRenderer(weave);
  const weaveDimensions = [weave.width, weave.height];

  // can be null (fit to screen), [w,h] or weaveDimensions
  let dimensions = weaveDimensions;
  update({
    dimensions,
  });

  let palette, background;
  const nextColors = () => {
    // palette = ["#f6f6f4", "#4169ff", "black", "#e54040"];
    palette = Random.shuffle(Random.pick(palettes).slice());
    weave.backgroundColor = palette.shift();
    weave.threads.forEach((thread) => {
      // const color = palette[1];
      const color = Random.pick(palette);
      thread.options.stroke = color;
      thread.options.fill = color;
    });
  };

  return {
    render,
    begin() {
      // nextColors();
    },
  };

  function render(props) {
    const { context, width, height, time, deltaTime } = props;

    renderWeave(context, props);
  }
};

canvasSketch(sketch, settings);
