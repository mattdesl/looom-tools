const { parse: parseSVG } = require("svg-parser");
const { parseTree: parseRawCSS } = require("tiny-css-parser");
const parsePath = require("parse-svg-path");
const { traverseDepthFirst } = require("./traverse");
const shadyCss = require("shady-css-parser");
const camelCase = require("camelcase");
const { mat2d, vec2 } = require("gl-matrix");

class Thread {
  constructor() {
    this.options = {};
    this.frames = [];
  }
}

module.exports = function parse(text, opts = {}) {
  const weave = parseLooomSVGContents(text, opts);

  // Parse all the transformations into matrices
  // and then turn path AST into simplified objects
  parseTransforms(weave);

  // Apply the view box transformation
  applyView(weave);

  // Now we figure out the bounds and then recenter it
  // applyBounds(weave);

  let duration = 0;
  weave.threads.forEach((thread) => {
    const frameCount = thread.frames.length;
    const fps = thread.options.speed;
    const dur = frameCount / fps;
    duration = Math.max(duration, dur);
  });

  return {
    ...weave,
    duration,
  };

  function applyBounds(weave, recenter = true) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    weave.threads.forEach((thread) => {
      const { visible = true, fillOpacity, strokeOpacity } = thread.options;
      const show = visible && (strokeOpacity > 0 || fillOpacity > 0);
      // non-visible threads are skipped from bound check
      if (!show) return;
      thread.frames.forEach((frame) => {
        frame.paths.forEach((path) => {
          path.commands.forEach((command) => {
            const t = command[0];
            if (t === "M" || t === "L") {
              const vec = command.slice(1, 3);
              const stack = [
                path.transform,
                frame.transform,
                thread.transform,
                weave.transform,
              ];
              stack.forEach((m) => vec2.transformMat2d(vec, vec, m));
              const x = vec[0];
              const y = vec[1];
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          });
        });
      });
    });

    weave.innerX = minX;
    weave.innerY = minY;
    weave.innerWidth = maxX - minX;
    weave.innerHeight = maxY - minY;
    const ax = (weave.width - weave.innerWidth) / 2 - weave.innerX;
    const ay = (weave.height - weave.innerHeight) / 2 - weave.innerY;

    const translation = [ax, ay];

    // pre-multiply transformation
    const preTransform = mat2d.fromTranslation([], translation);
    mat2d.multiply(weave.transform, preTransform, weave.transform);

    weave.innerX += ax;
    weave.innerY += ay;
  }

  function applyView(weave) {
    const [minX, minY, vw, vh] = weave.viewBox;
    const matrix = mat2d.identity([]);
    // console.log(weave.width / vw);
    mat2d.translate(matrix, matrix, [-minX, -minY]);
    mat2d.scale(matrix, matrix, [weave.width / vw, weave.height / vh]);
    mat2d.multiply(weave.view, matrix, weave.view);
  }

  function parseTransforms(contents) {
    contents.transform = parseTransform(contents.transform);
    contents.view = mat2d.identity([]);
    const threads = contents.threads;
    threads.forEach((thread) => {
      thread.transform = parseTransform(thread.transform);
      thread.frames = thread.frames.map((frame) => {
        let { transform = "", children = [] } = frame;
        transform = parseTransform(transform);

        const paths = [];
        children.map((child) => {
          if (child.tagName === "path") {
            const meta = {};
            const profile =
              child.properties["stroke-profile"] != null
                ? String(child.properties["stroke-profile"])
                : "";
            meta.transform = parseTransform(child.properties.transform);
            if (profile) {
              meta.strokeProfile = splitContents(profile).map((n) =>
                parseFloat(n)
              );
            }
            paths.push({
              ...meta,
              commands: parsePath(child.properties.d),
            });
          }
        });
        return {
          paths,
          transform,
        };
      });
    });
  }
};

function splitContents(contents) {
  return (contents || "").trim().split(/[\s\,]+/g);
}

function parseTransform(transforms) {
  let reg = /(\w+)\(([^\)]+)\)/g;
  let result;
  const matrix = mat2d.identity([]);
  transforms = transforms || "";
  while ((result = reg.exec(transforms)) !== null) {
    const key = result[1];
    const value = splitContents(result[2]).map((n) => parseFloat(n));
    if (key === "matrix") {
      mat2d.multiply(matrix, matrix, value.slice(0, 6));
    } else if (key === "translate") {
      const [tx, ty = 0] = value;
      mat2d.translate(matrix, matrix, [tx, ty]);
    } else if (key === "scale") {
      const sx = value[0];
      const sy = value[1] != null ? value[1] : sx;
      mat2d.scale(matrix, matrix, [sx, sy]);
    } else if (key === "rotate") {
      const rad = (value[0] * Math.PI) / 180;
      if (value[1] != null && value[2] != null) {
        const cx = value[1] || 0;
        const cy = value[2] || 0;
        mat2d.translate(matrix, matrix, [cx, cy]);
        mat2d.rotate(matrix, matrix, rad);
        mat2d.translate(matrix, matrix, [-cx, -cy]);
      } else {
        mat2d.rotate(matrix, matrix, rad);
      }
    } else if (key === "skew") {
      console.warn(
        "skew() operation not yet supported with { parseContents: true }"
      );
    }
  }
  return matrix;
}

function parseLooomSVGContents(text, opts = {}) {
  const root = {};
  const config = {};
  const weave = {};
  const threads = [];
  const threadRegex = /^\#?t([\d]+)$/;
  const frameRegex = /^\#?f([\d]+)$/;
  const document = parseSVG(text);
  const css = parseCSS(getCSS());

  traverseDepthFirst(document, (node) => {
    const { type, tagName } = node;
    const { props, className, style, id } = getCleanNodeProps(node);
    if (tagName === "svg") {
      const p = { ...props };
      delete p.xmlns;
      p.viewBox = splitContents(p.viewBox).map((n) => parseFloat(n));
      Object.assign(root, p);
    } else if (tagName === "g") {
      if (className === "weave") {
        Object.assign(weave, props);
      } else if (className === "thread") {
        const threadMatch = threadRegex.exec(id);
        if (threadMatch) {
          const threadIndex = parseInt(threadMatch[1], 10);
          const thread = threads[threadIndex];
          Object.assign(thread, props);
          thread.frames.length = 0;
          node.children.forEach((frame) => {
            const { props, className, style, id } = getCleanNodeProps(frame);
            const match = frameRegex.exec(id);
            if (match && className === "frame") {
              const frameIndex = parseInt(match[1], 10);
              thread.frames[frameIndex] = {
                ...props,
                tagName: frame.tagName,
                children: frame.children,
              };
            }
          });
          // fill holes
          for (let i = 0; i < frames.length; i++) {
            if (!frames[i]) frames[i] = null;
          }
        }
      }
    }
  });

  return {
    ...config,
    ...root,
    ...weave,
    threads: threads.map((thread) => ({ ...thread })),
  };

  function getCleanNodeProps(node) {
    const props = node.properties ? { ...node.properties } : {};
    const className = props.class;
    const id = props.id;
    const style = props.style;
    delete props.id;
    delete props.class;
    delete props.style;
    return {
      props,
      className,
      id,
      style,
    };
  }

  function parseCSS(cssText) {
    const parser = new shadyCss.Parser();
    const ast = parser.parse(cssText);

    const booleans = ["visible", "pressureEnabled", "masked", "latched"];

    ast.rules.forEach((rule) => {
      const { selector, type, rulelist } = rule;
      if (selector === "svg") {
        Object.assign(root, getProps(rulelist));
      } else if (selector === "#looom") {
        Object.assign(config, getProps(rulelist));
      } else {
        if (type === "ruleset") {
          const threadMatch = threadRegex.exec(selector);
          if (threadMatch) {
            const threadIndex = parseInt(threadMatch[1], 10) || 0;
            threads[threadIndex] = threads[threadIndex] || new Thread();
            const thread = threads[threadIndex];
            const props = getProps(rulelist);
            Object.entries(props).forEach(([key, value]) => {
              if (booleans.includes(key)) {
                props[key] = String(value) === "1";
              } else if (isNumber(value)) {
                props[key] = Number(value);
              }
            });
            Object.assign(thread.options, props);
          }
        }
      }
    });

    function getProps({ rules }) {
      const declarations = rules.filter((r) => r.type === "declaration");
      const props = {};
      declarations.forEach(({ name, value }) => {
        const key = camelCase(name);
        if (value.type === "expression") {
          props[key] = value.text;
        } else {
          console.log("Unknown value type", value);
        }
      });
      return props;
    }
  }

  function getCSS() {
    let css = "";
    $$("style", (node) => {
      if (
        node.children &&
        node.children[0] &&
        node.children[0].type === "text"
      ) {
        css += node.children[0].value;
      }
    });
    return css;
  }

  function $$(tagName, cb) {
    traverseDepthFirst(document, (node) => {
      if (node.tagName === tagName) cb(node);
    });
  }
}

function isNumber(x) {
  if (typeof x === "number") return true;
  if (/^0x[0-9a-f]+$/i.test(x)) return true;
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}
