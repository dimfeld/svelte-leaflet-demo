<script lang="ts">
  import * as L from 'leaflet';
  import { getContext } from 'svelte';

  let classNames: string | undefined = undefined;
  export { classNames as class };

  export let popup: L.Popup | undefined = undefined;

  let showContents = false;
  let popupOpen = false;

  const layer = getContext<() => L.Layer>('layer')();
  function createPopup(popupElement: HTMLElement) {
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

    return {
      destroy() {
        if (popup) {
          layer.unbindPopup();
          popup.remove();
          popup = undefined;
        }
      },
    };
  }
</script>

<div class="hidden">
  <div use:createPopup class={classNames}>
    {#if showContents}
      <slot />
    {/if}
  </div>
</div>
