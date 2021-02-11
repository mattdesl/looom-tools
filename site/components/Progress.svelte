<script>
  export let progress = 0.5;
  export let color = "white";

  let _progress;
  $: _progress = `${Math.floor(progress * 100).toFixed(4)}%`;
</script>

<div class="container" style="border-color: {color}">
  <div class="inner" style="background-color: {color}; width: {_progress};" />
</div>

<style>
  .inner {
    width: 100%;
    transform-origin: 0% 0%;
    height: 100%;
    /* border: 1px solid ; */
    box-sizing: border-box;
  }
  .container {
    box-sizing: border-box;
    margin-left: 10px;
    display: inline-block;
    border: 1px solid;
    border-radius: 6px;
    width: 100px;
    height: 6px;
  }
</style>
