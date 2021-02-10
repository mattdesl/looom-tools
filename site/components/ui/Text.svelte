<script>
  import Prop from "./Prop.svelte";
  import TextInput from "./dom/TextInput.svelte";
  export let label = "";
  export let value = "";
  export let readonly = false;
</script>

<style>

</style>

<Prop {label}>
  <TextInput bind:value {readonly} />
</Prop>
