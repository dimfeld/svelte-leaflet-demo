<script lang="typescript">
  import * as L from 'leaflet';
  import type { Msa, Flow } from './types';
  import Leaflet from './map/Leaflet.svelte';
  import GeoJson from './map/GeoJson.svelte';
  import Polyline from './map/Polyline.svelte';
  import Curve from './map/Curve.svelte';
  import Tooltip from './map/Tooltip.svelte';
  import Pane from './map/Pane.svelte';
  import MapControls from './MapControls.svelte';
  import * as topojson from 'topojson-client';
  import { scaleSqrt } from 'd3-scale';
  import makeLineCoordinates from './map/curves';

  import msaData from '../../data/msas.json';
  import topoData from '../../data/topo.json';
  import flowsData from '../../data/flows.json';

  const features = topojson.feature(topoData, 'msas');
  console.log(features);

  let geojsons = new Map();
  for (let g of features.features) {
    geojsons.set(g.properties.CBSAFP, g);
  }

  let msas = new Map<string, Msa>();
  for (let msa of msaData) {
    let geojson = geojsons.get(msa.id);
    let net = msa.totalIncoming - msa.totalOutgoing;

    msas.set(msa.id, {
      ...msa,
      name: geojson.properties.NAME,
      net,
      netAsPercent: (100 * net) / msa.population,
      feature: geojson,
      outgoing: [],
      incoming: [],
    });
  }

  for (let [source, dest, count] of flowsData) {
    let sourceMsa = msas.get(source);
    let destMsa = msas.get(dest);
    if (!sourceMsa || !destMsa) {
      continue;
    }

    if (count > 0) {
      sourceMsa.outgoing.push({ id: dest, count });
      destMsa.incoming.push({ id: source, count });
    } else {
      count = -count;
      sourceMsa.incoming.push({ id: dest, count });
      destMsa.outgoing.push({ id: source, count });
    }
  }

  for (let msa of msas.values()) {
    msa.outgoing.sort((a, b) => b.count - a.count);
    msa.incoming.sort((a, b) => b.count - a.count);
  }

  console.log(msas);

  $: posColorScale = scaleSqrt()
    .domain([0, colorBounds.max])
    .range(['hsl(30, 100%, 80%)', 'hsl(30, 100%, 30%)']);
  $: negColorScale = scaleSqrt()
    .domain([0, -colorBounds.min])
    .range(['hsl(240, 100%, 80%)', 'hsl(240, 100%, 30%)']);

  $: netToColor = (net: number) => {
    if (net > 0) {
      return posColorScale(net);
    } else if (net < 0) {
      return negColorScale(-net);
    } else {
      return 'green';
    }
  };

  interface SortSetting {
    sort: (a: Msa, b: Msa) => number;
    limit: (list: Msa[]) => Msa[];
  }
  const sortSettings: Record<string, SortSetting> = {
    all: {
      sort: (a, b) => b.netAsPercent - a.netAsPercent,
      limit: (list) => list,
    },
    largeNetPercent: {
      sort: (a, b) => b.netAsPercent - a.netAsPercent,
      limit: (list) => list.slice(0, 20).concat(list.slice(-20)),
    },
    largeNet: {
      sort: (a, b) => b.net - a.net,
      limit: (list) => list.slice(0, 20).concat(list.slice(-20)),
    },
  };

  let filterSetting: string = 'all';
  let activeMsas: Msa[] = [];
  $: {
    let sortedMsas = Array.from(msas.values()).sort(
      sortSettings[filterSetting].sort
    );
    activeMsas = sortSettings[filterSetting].limit(sortedMsas);
  }

  let countField: keyof Msa = 'netAsPercent';
  $: colorBounds = activeMsas.reduce(
    (acc, msa) => {
      return {
        min: Math.min(acc.min, msa[countField]),
        max: Math.max(acc.max, msa[countField]),
      };
    },
    { min: Infinity, max: -Infinity }
  );

  const initialBounds = L.latLngBounds([24, -126], [50, -66]);

  interface Line {
    id: string;
    path: (string | [number, number])[];
    color: string;
    animationSpeed: string;
  }

  const incomingLineColor = 'hsl(30, 100%, 40%)';
  const outgoingLineColor = 'blue';

  let loaded = false;
  function resizeMap() {}
</script>

<svelte:window on:resize={resizeMap} on:load={() => (loaded = true)} />

<div class="w-screen h-screen flex flex-col">
  <div class="flex-grow">Map</div>
  <div class="flex-none h-80">Info</div>
</div>
