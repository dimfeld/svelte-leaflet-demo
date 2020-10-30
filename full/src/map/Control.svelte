<script context="module" lang="ts">
  import * as L from 'leaflet';
  class Control extends L.Control {
    el: HTMLElement;
    constructor(
      el: HTMLElement,
      position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
    ) {
      super({ position });
      this.el = el;
    }

    onAdd() {
      return this.el;
    }

    onRemove() {}
  }
</script>

<script lang="ts">
  import { getContext, onDestroy } from 'svelte';

  let classNames: string | undefined = undefined;
  export { classNames as class };

  export let position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  /** The control instance created by this component */
  export let control: Control | undefined = undefined;

  let container: HTMLElement;
  const map = getContext<() => L.Map>('map')();

  $: if (map && !control && container) {
    control = new Control(container, position).addTo(map);
  }

  onDestroy(() => {
    if (control) {
      control.remove();
      control = undefined;
    }
  });
</script>

<div class="hidden">
  <div bind:this={container} class={classNames}>
    {#if control}
      <slot {control} />
    {/if}
  </div>
</div>
