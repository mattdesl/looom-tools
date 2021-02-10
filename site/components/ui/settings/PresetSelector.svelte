<script>
  import { Prop } from '/props';
  import { afterUpdate, createEventDispatcher } from 'svelte';
  import { PaperSizes } from 'canvas-sketch';

  let presets = Object.entries(PaperSizes).map(e => {
    let [ key, value ] = e;
    key = key.toUpperCase();
    return { name: key, settings: value };
  }).filter(({ name }) => /^[A]\d/i.test(name))
    .map(item => {
      item.name = `Print - ${item.name}`;
      item.settings = { pixelsPerInch: 300, ...item.settings };
      return item;
    });

  presets = [
    { name: 'Web - 1:1', settings: {
      dimensions: [ 2048, 2048 ],
      units: 'px',
      pixelsPerInch: 72
    } },
    { name: 'Web - 4:3', settings: {
      dimensions: [2880/2, 2160/2],
      pixelsPerInch: 72,
      units: "px"
    } },
    { name: 'Web - 16:9', settings: {
      dimensions: [3840/2, 2160/2],
      pixelsPerInch: 72,
      units: "px"
    } },
    { name: 'Web - 16:10', settings: {
      dimensions: [3456/2, 2160/2],
      pixelsPerInch: 72,
      units: "px"
    } },
    ...presets,
    
  ]

  export let label = '';

  let selected;

  const presetOptions = [
    { name: 'Choose from presets...', settings: null },
    ...presets
  ]

  const options = presetOptions;
  const dispatch = createEventDispatcher();
  let element;

  afterUpdate(() => {
    const value = selected;
    if (value && value.settings) {
      dispatch('change', value);
    }
    selected = presetOptions[0];
    element.blur();
  });
</script>

<Prop {label}>
  <select bind:this={element} selected={presetOptions[0]} bind:value={selected}>
    {#each options as item}
      <option value={item}>
        {typeof item === 'string' ? item : item.name}
      </option>
    {/each}
  </select>
</Prop>

<style>
select {
  cursor: pointer;
  outline: 0;
  width: 100%;
  height: auto;
  box-sizing: border-box;
  margin: 0;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid #b5b5b5;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat, repeat;
  background-color: white;
  background-position: right .7em top 50%, 0 0;
  background-size: .65em auto, 100%;
}
</style>