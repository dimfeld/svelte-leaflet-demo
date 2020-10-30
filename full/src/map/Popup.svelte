<script lang="ts">
  import * as L from 'leaflet';
  import { getContext, onDestroy } from 'svelte';

  const layer = getContext<() => L.Layer>('layer')();

  let classNames: string | undefined = undefined;
  export { classNames as class };

  export let popup: L.Popup | undefined = undefined;

  let popupElement: HTMLElement;
  let showContents = false;
  let popupOpen = false;
  $: if (!popup && popupElement) {
    popup = L.popup().setContent(popupElement);
    layer.bindPopup(popup);

    layer.on('popupopen', () => {
      popupOpen = true;
      showContents = true;
    });

    layer.on('popupclose', () => {
      popupOpen = false;
      // Wait for the popup to completely fade out before destroying it.
      // Otherwise the fade out looks weird as the contents disappear too early.
      setTimeout(() => {
        if (!popupOpen) {
          showContents = false;
        }
      }, 500);
    });
  }

  onDestroy(() => {
    if (popup) {
      layer.unbindPopup();
      popup.remove();
      popup = undefined;
    }
  });
</script>

<div class="hidden">
  <div bind:this={popupElement} class={classNames}>
    {#if showContents}
      <slot />
    {/if}
  </div>
</div>
