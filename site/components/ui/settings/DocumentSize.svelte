<script>
  import { Prop, Vector, Number, Select } from '/props';
  import convertLength from 'convert-length';
  import PresetSelector from './PresetSelector.svelte';
  import { createEventDispatcher } from 'svelte';
  import deepEqual from 'deep-equal';

  const unitTypes = ['px','cm','mm','in'];
  const orientations = [
    { name: 'Default', value: undefined },
    { name: 'Landscape', value: 'landscape' },
    { name: 'Portrait', value: 'portrait' }
  ];

  const DEFAULT_DIMENSIONS = [ 2048, 2048 ];
  const DEFAULT_PIXELS_PER_INCH = 72;
  const DEFAULT_ORIENTATION = null;
  const DEFAULT_UNITS = 'px';

  let _oldValue = null;

  export let dimensions = DEFAULT_DIMENSIONS.slice();
  export let units = DEFAULT_UNITS;
  export let pixelsPerInch = DEFAULT_PIXELS_PER_INCH;
  export let value = {
    dimensions: dimensions.slice(),
    units,
    pixelsPerInch
  };
  
  let dispatch = createEventDispatcher();
  let canvasWidth;
  let canvasHeight;

  $: {
    canvasWidth = convertLength(dimensions[0], units, 'px', { pixelsPerInch, roundPixel: true });
    canvasHeight = convertLength(dimensions[0], units, 'px', { pixelsPerInch, roundPixel: true });
    value = {
      dimensions,
      units,
      pixelsPerInch
    };
    dispatchIfChanged();
  }

  function presetChanged ({ detail }) {
    const { settings } = detail;
    dimensions = Array.isArray(settings.dimensions) ? settings.dimensions.slice() : settings.dimensions;
    units = settings.units || DEFAULT_UNITS;
    pixelsPerInch = settings.pixelsPerInch || DEFAULT_PIXELS_PER_INCH;
    value = {
      dimensions,
      units,
      pixelsPerInch
    };
    dispatchIfChanged();
  }

  function dispatchIfChanged () {
    if (!deepEqual(_oldValue, value)) {
      _oldValue = { ...value };
      dispatch('change', value);
    }
  }
</script>

<PresetSelector label='Size' on:change={presetChanged} />
<Vector
  label
  type='size'
  bind:x={dimensions[0]} bind:y={dimensions[1]}
  min={1}
  bind:units
  {unitTypes}
/>
<Vector units='px' label type='size' readonly x={canvasWidth} y={canvasHeight} />
<Vector
  label
  type={{ components: ['DPI'] }}
  bind:x={pixelsPerInch}
  min={1}
/>

<style>
</style>
