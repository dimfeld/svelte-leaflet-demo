<script lang="typescript">
  import * as L from 'leaflet';
  import Leaflet from 'map/Leaflet.svelte';
  import GeoJson from 'map/GeoJson.svelte';

  let map: L.Map;

  let activeMsas = [];
</script>

<div class="w-full h-full">
  <Leaflet bind:map>
    {#each activeMsas as msa (msa.id)}
      <GeoJson {map} geojson={msa.geojson} fill="#ff0000" />
    {/each}
  </Leaflet>
</div>
