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

  const container = getContext<() => L.LayerGroup>('layerGroup')();
  export let layer: L.GeoJSON = L.geoJSON(geojson)
    .on('mouseover', (e) => dispatch('mouseover', e))
    .on('mouseout', (e) => dispatch('mouseout', e))
    .on('click', (e) => dispatch('click', e))
    .addTo(container);

  setContext('layer', () => layer);

  onDestroy(() => {
    layer.remove();
  });

  $: layerStyle = flush({ color, fillColor, fillOpacity, weight });
  $: layer.setStyle(layerStyle);
</script>

<slot />
