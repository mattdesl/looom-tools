<script>
  import Color from "canvas-sketch-util/color";
  import { createEventDispatcher } from "svelte";

  export let toggleable = false;
  export let value = false;
  export let enabled = true;
  export let input = false;
  export let color = "black";
  export let alt = "";
  export let big = false;

  const dispatch = createEventDispatcher();

  let _color;
  $: {
    if (enabled) _color = color;
    else {
      const rgb = Color.parse(color).rgb;
      const alpha = 0.25;
      _color = `rgba(${rgb.join(", ")}, ${alpha})`;
    }
  }

  const svgs = {
    "file-upload": `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file-upload" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
  <line x1="12" y1="11" x2="12" y2="17" />
  <polyline points="9 14 12 11 15 14" />
</svg>`,
    "player-play": `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-play" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M7 4v16l13 -8z"></path>
</svg>`,
    "player-pause": `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-pause" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <rect x="6" y="5" width="4" height="14" rx="1"></rect>
   <rect x="14" y="5" width="4" height="14" rx="1"></rect>
</svg>`,
    "player-stop": `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-stop" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <rect x="5" y="5" width="14" height="14" rx="2"></rect>
</svg>`,
    "player-record": `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-record" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <circle cx="12" cy="12" r="7"></circle>
</svg>`,
    "player-recording": `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-record" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <circle cx="12" cy="12" r="7" fill="currentColor"></circle>
</svg>`,
    "settings-open": `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-settings" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path fill-rule="evenodd" clip-rule="evenodd" d="M13.675 4.317C13.249 2.561 10.751 2.561 10.325 4.317C10.049 5.452 8.753 5.99 7.753 5.382C6.209 4.442 4.443 6.209 5.383 7.752C5.5243 7.98375 5.60889 8.24559 5.62987 8.51621C5.65085 8.78683 5.60764 9.05859 5.50375 9.30935C5.39985 9.56011 5.23822 9.7828 5.032 9.95929C4.82578 10.1358 4.5808 10.2611 4.317 10.325C2.561 10.751 2.561 13.249 4.317 13.675C4.58056 13.7391 4.82529 13.8645 5.03127 14.0409C5.23726 14.2174 5.3987 14.44 5.50247 14.6906C5.60624 14.9412 5.64942 15.2128 5.62848 15.4832C5.60755 15.7537 5.5231 16.0153 5.382 16.247C4.442 17.791 6.209 19.557 7.752 18.617C7.98375 18.4757 8.24559 18.3911 8.51621 18.3701C8.78683 18.3491 9.05859 18.3924 9.30935 18.4963C9.56011 18.6001 9.7828 18.7618 9.95929 18.968C10.1358 19.1742 10.2611 19.4192 10.325 19.683C10.751 21.439 13.249 21.439 13.675 19.683C13.7391 19.4194 13.8645 19.1747 14.0409 18.9687C14.2174 18.7627 14.44 18.6013 14.6906 18.4975C14.9412 18.3938 15.2128 18.3506 15.4832 18.3715C15.7537 18.3924 16.0153 18.4769 16.247 18.618C17.791 19.558 19.557 17.791 18.617 16.248C18.4757 16.0162 18.3911 15.7544 18.3701 15.4838C18.3491 15.2132 18.3924 14.9414 18.4963 14.6907C18.6001 14.4399 18.7618 14.2172 18.968 14.0407C19.1742 13.8642 19.4192 13.7389 19.683 13.675C21.439 13.249 21.439 10.751 19.683 10.325C19.4194 10.2609 19.1747 10.1355 18.9687 9.95905C18.7627 9.78258 18.6013 9.55999 18.4975 9.30938C18.3938 9.05877 18.3506 8.78721 18.3715 8.51677C18.3924 8.24634 18.4769 7.98466 18.618 7.753C19.558 6.209 17.791 4.443 16.248 5.383C16.0162 5.5243 15.7544 5.60889 15.4838 5.62987C15.2132 5.65085 14.9414 5.60764 14.6907 5.50375C14.4399 5.39985 14.2172 5.23822 14.0407 5.032C13.8642 4.82578 13.7389 4.5808 13.675 4.317ZM15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" fill="currentColor" />
</svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-settings" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path>
   <circle cx="12" cy="12" r="3"></circle>
</svg>`,
  };

  export let svg = "";
  let _svg;
  $: _svg = svg ? svgs[svg] : null;
</script>

<button
  class:big
  class="icon-button"
  disabled={!enabled}
  style="color: {_color}"
  title={alt}
  on:click={(e) => {
    if (toggleable) {
      value = !value;
    }
    dispatch("click", e);
  }}
>
  {#if input}
    <input
      class:big
      type="file"
      accept=".svg, image/svg+xml"
      on:input={(e) => {
        if (e.currentTarget.files.length > 0) {
          dispatch("file", e.currentTarget.files[0]);
        }
      }}
    />
  {/if}
  {#if _svg}
    {@html _svg}
  {/if}
</button>

<style>
  button {
    cursor: pointer;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    padding: 5px;
    appearance: none;
    outline: none;
    color: currentColor;
    background: transparent;
    overflow: hidden;
    box-sizing: content-box;
    border: 0;
    /* margin-left: 5px; */
    cursor: pointer;
    opacity: 1;
    transform: scale(0.9, 0.9);
    will-change: transform, opacity;
    transition: all 0.1s ease-out;
  }
  .big {
    width: 32px;
    height: 32px;
  }
  button:hover {
    opacity: 1;
    transform: scale(1, 1);
    will-change: transform, opacity;
    transition: all 0.1s ease-out;
  }
  button:first-child {
    margin-left: 0;
  }
  input {
    text-indent: -999em;
    cursor: pointer;
    font-size: 10px;
    color: transparent;
    outline: none;
    appearance: none;
    background: none;
    width: 24px;
    height: 24px;
    position: absolute;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    /* opacity: 0; */
    z-index: 10;
  }
  input.big {
    width: 32px;
    height: 32px;
  }
  :global(button.icon-button svg) {
    pointer-events: none;
    width: 100%;
    height: 100%;
    color: currentColor;
  }
  @media only screen and (max-device-width: 768px) {
    .icon-button {
      width: 32px;
      height: 32px;
    }
    input {
      width: 32px;
      height: 32px;
    }
  }
</style>
