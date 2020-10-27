<script lang="typescript">
  import * as L from 'leaflet';
  import type { Msa, Flow } from './types';
  import Leaflet from './map/Leaflet.svelte';
  import GeoJson from './map/GeoJson.svelte';
  import PolyLine from './map/PolyLine.svelte';
  import Tooltip from './map/Tooltip.svelte';
  import MapControls from './MapControls.svelte';
  import * as topojson from 'topojson-client';
  import { scaleSqrt } from 'd3-scale';

  import msaData from '../../data/msas.json';
  import topoData from '../../data/topo.json';
  import flowsData from '../../data/flows.json';

  const features = topojson.feature(topoData, 'msas');
  console.log(features);

  let map: L.Map;
  function resizeMap() {
    if (map) {
      map.invalidateSize();
    }
  }

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

  $: sortedMsas = Array.from(msas.values()).sort(
    (a, b) => b[countField] - a[countField]
  );

  let countField: keyof Msa = 'netAsPercent';
  // let activeMsas = [...msasByNet.slice(0, 20), ...msasByNet.slice(-20)];
  $: activeMsas = sortedMsas;
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

  let clickMsa: Msa;
  let hoverMsa: Msa | undefined;

  let hoveringInList = false;
  $: infoMsa = hoverMsa || clickMsa;
  $: listMsa = hoveringInList ? clickMsa : infoMsa;

  let loaded = false;

  interface Line {
    id: string;
    latLngs: [number, number][];
    color: string;
  }

  function linesForMsa(msa: Msa): Line[] {
    if (!msa) {
      return [];
    }

    let centroidLatLng = [msa.centroid[1], msa.centroid[0]];

    let incomingLines = msa.incoming.slice(0, 10).map((flow) => {
      let source = msas.get(flow.id)!;
      return {
        id: `${msa.id}:${source.id}`,
        latLngs: [[source.centroid[1], source.centroid[0]], centroidLatLng],
        color: 'orange',
      };
    });

    let outgoingLines = msa.outgoing.slice(0, 10).map((flow) => {
      let dest = msas.get(flow.id)!;
      return {
        id: `${dest.id}:${msa.id}`,
        latLngs: [centroidLatLng, [dest.centroid[1], dest.centroid[0]]],
        color: 'blue',
      };
    });

    return [...incomingLines, ...outgoingLines];
  }

  $: lines = [
    ...linesForMsa(clickMsa),
    ...(hoverMsa && hoverMsa !== clickMsa ? linesForMsa(hoverMsa) : []),
  ];

  $: hasLines = new Set(lines.flatMap((l) => l.id.split(':')));
</script>

<style>
  #container {
    display: grid;
    grid-template:
      'filters map' auto
      'filters controls' 16rem
      / 16rem auto;
  }
</style>

<svelte:window on:resize={resizeMap} on:load={() => (loaded = true)} />

<div class="w-screen h-screen" id="container">
  <div style="grid-area:filters">Filters</div>

  <div style="grid-area:map">
    <!-- Show the map only once the window has loaded, so that Leaflet gets the sizing right. -->
    {#if loaded || document.readyState === 'complete'}
      <Leaflet bind:map bounds={initialBounds}>
        <MapControls {initialBounds} {msas} {infoMsa} />
        {#each activeMsas as msa (msa.id)}
          <GeoJson
            geojson={msa.feature}
            fillOpacity={0.6}
            fillColor={netToColor(msa[countField])}
            weight={hasLines.has(msa.id) ? 2 : 0}
            color="black"
            on:click={() => (clickMsa = msa)}
            on:mouseover={() => {
              hoverMsa = msa;
              hoveringInList = false;
            }}
            on:mouseout={() => {
              if (hoverMsa === msa) {
                hoverMsa = undefined;
              }
            }} />
        {/each}

        {#each lines as line}
          <PolyLine
            latLngs={line.latLngs}
            color={line.color}
            dashArray="8 10" />
        {/each}
      </Leaflet>
    {/if}
  </div>

  <div style="grid-area:controls" class="flex text-sm">
    {#if listMsa}
      <div class="w-1/3">
        <p class="font-medium text-gray-800">Top Sources</p>
        {#each listMsa.incoming.slice(0, 10) as msa}
          <p
            class="hover:bg-gray-100 cursor-pointer"
            on:click={() => (clickMsa = msas.get(msa.id))}
            on:mouseover={() => {
              hoverMsa = msas.get(msa.id);
              hoveringInList = true;
            }}
            on:mouseout={() => (hoverMsa = null)}>
            {msas.get(msa.id).name}
            -
            {msa.count}
          </p>
        {/each}
      </div>

      <div class="w-1/3">
        <p class="font-medium text-gray-800">Top Destinations</p>
        {#each listMsa.outgoing.slice(0, 10) as msa}
          <p
            class="hover:bg-gray-100 cursor-pointer"
            on:mouseover={() => {
              hoverMsa = msas.get(msa.id);
              hoveringInList = true;
            }}
            on:mouseout={() => (hoverMsa = null)}
            on:click={() => (clickMsa = msas.get(msa.id))}>
            {msas.get(msa.id).name}
            -
            {msa.count}
          </p>
        {/each}
      </div>
    {/if}
  </div>
</div>
