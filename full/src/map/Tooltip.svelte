<script lang="ts">
  import * as L from 'leaflet';
  import type { Readable } from 'svelte/store';
  import { writable } from 'svelte/store';
  import { getContext, setContext, onDestroy } from 'svelte';

  let classNames: string | undefined = undefined;
  export { classNames as class };

  export let permanent = false;
  export let sticky = false;
  export let interactive = false;

  export let tooltip: L.Tooltip | undefined = undefined;

  const layer = getContext<Readable<L.Layer>>('layer');
  let layerStore = writable<L.Tooltip | undefined>(tooltip);
  setContext('layer', layerStore);

  let tooltipElement: HTMLElement;
  let showContents = permanent;
  let tooltipOpen = permanent;
  $: if ($layer && tooltipElement && !tooltip) {
    tooltip = L.tooltip({ permanent, sticky, interactive }).setContent(
      tooltipElement
    );
    $layer.bindTooltip(tooltip);
    layerStore.set(tooltip);

    $layer.on('tooltipopen', () => {
      tooltipOpen = true;
      showContents = true;
    });

    $layer.on('tooltipclose', () => {
      tooltipOpen = false;
      // Wait for the tooltip to completely fade out before destroying it.
      // Otherwise the fade out looks weird as the contents disappear too early.
      setTimeout(() => {
        if (!tooltipOpen) {
          showContents = false;
        }
      }, 500);
    });
  }

  onDestroy(() => {
    if (tooltip) {
      $layer?.unbindTooltip();
      tooltip.remove();
      tooltip = undefined;
    }
  });
</script>

<div class="hidden">
  <div bind:this={tooltipElement} class={classNames}>
    {#if showContents}
      <slot />
    {/if}
  </div>
</div>
