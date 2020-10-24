<script lang="typescript">
  import * as L from 'leaflet';
  import flush from 'just-flush';
  import type { Readable } from 'svelte/store';
  import { writable } from 'svelte/store';
  import {
    getContext,
    setContext,
    onDestroy,
    createEventDispatcher,
  } from 'svelte';

  const dispatch = createEventDispatcher();

  export let geojson: any;
  export let color: string;
  export let fillColor: string | undefined = undefined;
  export let fillOpacity: number | undefined = undefined;
  export let weight: number | undefined = undefined;

  export let layer: L.GeoJSON | null = null;

  const container: Readable<L.LayerGroup> = getContext('layerGroup');
  let layerStore = writable<L.GeoJSON | null>(layer);
  setContext('layer', layerStore);

  $: layerStyle = flush({ color, fillColor, fillOpacity, weight });

  $: if ($container && !layer) {
    layer = L.geoJSON(geojson, {
      style: function (feature) {
        return layerStyle;
      },
    })
      .on('mouseover', (e) => dispatch('mouseover', e))
      .on('mouseout', (e) => dispatch('mouseout', e))
      .on('click', (e) => dispatch('click', e));

    layerStore.set(layer);
    layer.addTo($container);
  }

  onDestroy(() => {
    if (layer) {
      layer.remove();
      layer = null;
    }
  });

  $: layer?.setStyle(layerStyle);
</script>

<slot />
