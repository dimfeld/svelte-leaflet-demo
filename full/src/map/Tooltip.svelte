<script lang="ts">
  import * as L from 'leaflet';
  import { getContext } from 'svelte';

  let classNames: string | undefined = undefined;
  export { classNames as class };

  export let permanent = false;
  export let sticky = false;
  export let interactive = false;

  export let tooltip: L.Tooltip | undefined = undefined;

  const layer = getContext<() => L.Layer>('layer')();

  let showContents = permanent;
  let tooltipOpen = permanent;

  function createTooltip(tooltipElement: HTMLElement) {
    tooltip = L.tooltip({ permanent, sticky, interactive }).setContent(
      tooltipElement
    );

    layer.bindTooltip(tooltip);

    layer.on('tooltipopen', () => {
      tooltipOpen = true;
      showContents = true;
    });

    layer.on('tooltipclose', () => {
      tooltipOpen = false;
      // Wait for the tooltip to completely fade out before destroying it.
      // Otherwise the fade out looks weird as the contents disappear too early.
      setTimeout(() => {
        if (!tooltipOpen) {
          showContents = false;
        }
      }, 500);
    });

    return {
      destroy() {
        if (tooltip) {
          layer.unbindTooltip();
          tooltip.remove();
          tooltip = undefined;
        }
      },
    };
  }
</script>

<div class="hidden">
  <div use:createTooltip class={classNames}>
    {#if showContents}
      <slot />
    {/if}
  </div>
</div>
