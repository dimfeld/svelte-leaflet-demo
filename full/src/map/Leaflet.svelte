<script lang="typescript">
  import * as L from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  export let height = '100%';
  export let map;

  function createLeaflet(node) {
    map = L.map(node).setView([51.505, -0.09], 13);
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
        map.remove();
      },
    };
  }
</script>

<div style="height:{height}:width:100%" use:createLeaflet>
  <slot {map} />
</div>
