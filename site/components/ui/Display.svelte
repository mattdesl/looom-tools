<script>
  import Prop from "./Prop.svelte";

  const DEFAULT_PRECISION = 2;
  export let label = undefined;
  export let value = "#000000";
  export let round = true;
  export let eulerToDegrees = true;
  export let nameVectors = false;
  export let degreeSymbol = "º";
  export let maxJSONLength = 25;
  export let convert = undefined;

  let displayValue;
  $: updateDisplay(value);

  function doConversion(convertType, value) {
    if (convertType === "degrees" || convertType === "radians") {
      if (typeof value !== "number")
        throw new Error("Expected number for convert type " + convertType);
      return convertType === "degrees"
        ? `${(value / Math.PI) * 180}deg`
        : `${(value * Math.PI) / 180}rad`;
    }
  }

  function updateDisplay(value) {
    let ret;
    if (convert) ret = doConversion(convert, value);
    if (typeof ret === "string") {
      displayValue = ret;
    } else {
      let input = ret != null ? ret : value;
      displayValue = toStringValue(input);
    }
  }

  function toStringValue(value, root = true) {
    const type = typeof value;
    if (type === "boolean") {
      return String(value);
    } else if (type === "string") {
      return value;
    } else if (type === "function") {
      return `ƒ ${value.name}`;
    } else if (type === "number") {
      const p =
        typeof round === "number" && isFinite(round)
          ? round
          : DEFAULT_PRECISION;
      return round ? String(parseFloat(value.toFixed(p))) : String(value);
    } else if (value == null) {
      return String(value);
    } else if (Array.isArray(value)) {
      if (root) {
        const str = value
          .map((el) => {
            return toStringValue(el, false);
          })
          .join(", ");
        return `[ ${str} ]`;
      } else {
        return `Array(${value.length})`;
      }
    } else if (type === "object" && value) {
      if (value.isColor && typeof value.getHexString === "function") {
        return `#${value.getHexString().toUpperCase()}`;
      }
      if (value.isVector2 || value.isVector3 || value.isVector4) {
        const els = value.toArray().map((n) => toStringValue(n, false));
        const d = els.length;
        const name = nameVectors ? `Vector${d}` : "";
        return `${name}(${els.join(", ")})`;
      } else if (value.isQuaternion || value.isEuler) {
        const name = nameVectors
          ? value.isQuaternion
            ? "Quaternion"
            : "Euler"
          : "";
        const raw = value.toArray();
        let els = raw.map((n) => toStringValue(n, false));
        if (value.isEuler && value.order === "XYZ") els.pop();
        if (value.isEuler && eulerToDegrees) {
          for (let i = 0; i < 3; i++) {
            els[i] =
              toStringValue(Math.round((raw[i] / Math.PI) * 180), false) +
              degreeSymbol;
          }
        }
        return `${name}(${els.join(", ")})`;
      } else if (value.isMatrix4 || value.isMatrix3) {
        const els = value.toArray().map((n) => toStringValue(n, false));
        const d = els.length;
        const name = nameVectors
          ? value.isMatrix4
            ? `Matrix4`
            : `Matrix3`
          : "";
        return `${name}(${els.join(", ")})`;
      } else if (isPlainObject(value)) {
        let str = "";
        try {
          str = JSON.stringify(value);
        } catch (e) {
          str = "[Circular]";
        }
        if (str.length > maxJSONLength) return "Object{...}";
        else return str;
      } else if (value.constructor && value.constructor.name) {
        return `${value.constructor.name}(...)`;
      } else {
        return "Object(...)";
      }
    } else {
      return String(value);
    }
  }

  function isObject(o) {
    return Object.prototype.toString.call(o) === "[object Object]";
  }

  function isPlainObject(o) {
    var ctor, prot;

    if (isObject(o) === false) return false;

    // If has modified constructor
    ctor = o.constructor;
    if (ctor === undefined) return true;

    // If has modified prototype
    prot = ctor.prototype;
    if (isObject(prot) === false) return false;

    // If constructor does not have an Object-specific method
    if (prot.hasOwnProperty("isPrototypeOf") === false) {
      return false;
    }

    // Most likely a plain Object
    return true;
  }
</script>

<style>
  div {
    width: 100%;
    /* padding: 5px 5px; */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    font-weight: 400;
    font-size: 10px;
    box-sizing: border-box;
    /* border-radius: 2px; */
    /* border: 1px solid transparent; */
    /* padding: 2.5px; */
  }
  div:hover {
    /* border: 1px solid hsl(0, 0%, 95%); */
  }
</style>

<Prop {label}>
  <div title={displayValue}>{displayValue}</div>
</Prop>
