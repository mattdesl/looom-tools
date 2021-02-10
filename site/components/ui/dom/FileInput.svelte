<script>
  export let text = "Select or Drop File";
  export let active = false;
  export let expand = false;
  export let accept = undefined;
  export let multiple = false;
</script>

<style>
  input {
    margin-bottom: 5px;
    margin-top: 5px;
    cursor: pointer;
    -webkit-appearance: none;
    border: none;
    background: none;
    border-radius: 5px;
    padding: 0;
    overflow: hidden;
    width: 150px;
    height: 25px;
    outline: 0;
    box-sizing: border-box;
    border: 1px dashed hsl(0, 0%, 80%);
    padding: 0;
    margin: 0;
    color: transparent;
  }
  input.expand {
    width: 100%;
  }
  input:hover {
    border: 1px dashed hsl(0, 0%, 50%);
  }
  input::-webkit-file-upload-button {
    visibility: hidden;
  }
  input:hover::before {
    background: hsl(0, 0%, 95%);
  }
  input::before {
    color: black;
    background: white;
    width: 100%;
    height: 100%;
    content: attr(data-text);
    font-size: 10px;
    color: hsl(0, 0%, 50%);
    font-style: italic;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

<input
  class:expand
  class:active
  type="file"
  {multiple}
  data-text={text}
  {accept}
  on:input />
