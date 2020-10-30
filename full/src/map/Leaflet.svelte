<script lang="typescript">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import * as L from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  export let height = '100%';
  export let bounds: L.LatLngBounds;
  export let map: L.Map | undefined = undefined;

  const getMap = () => map;
  setContext('layerGroup', getMap);
  setContext('layer', getMap);
  setContext('map', getMap);

  function createLeaflet(node: HTMLElement) {
    map = L.map(node).fitBounds(bounds);
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        map.fitBounds(bounds);
      }
    }, 250);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
          &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
        subdomains: 'abcd',
        maxZoom: 14,
      }
    ).addTo(map);

    return {
      destroy() {
        map!.remove();
        map = undefined;
      },
    };
  }

  $: map?.fitBounds(bounds);
</script>

<style>
  :global(.leaflet-control-container) {
    position: static;
  }
</style>

<div style="height:{height};width:100%" use:createLeaflet>
  {#if map}
    <slot {map} />
  {/if}
</div>
