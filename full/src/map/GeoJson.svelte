<script lang="typescript">
  import * as L from 'leaflet';
  import type { SvelteComponent } from 'svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import { bindPopup } from './popup';

  const dispatch = createEventDispatcher();

  export let map;
  export let geojson;
  export let fill;

  export let popup: string | typeof SvelteComponent | undefined = undefined;
  export let popupProps: object | undefined = undefined;

  let layer: L.GeoJSON;
  onMount(() => {
    let layer = L.geoJSON(geojson, {
      style: function (feature) {
        return { color: fill };
      },
    });

    bindPopup(layer, popup, popupProps);
    layer.addTo(map);

    layer.on('mouseover', (e) => dispatch('mouseover', e));
    layer.on('mouseout', (e) => dispatch('mouseout', e));
    layer.on('click', (e) => dispatch('click', e));

    return () => {
      layer.remove();
      layer = null;
    };
  });

  $: if (layer) {
    layer.setStyle({ color: fill });
  }
</script>
