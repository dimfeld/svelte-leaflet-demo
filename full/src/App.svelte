<script lang="typescript">
  import * as L from 'leaflet';
  import type { Msa, Flow } from './types';
  import Leaflet from './map/Leaflet.svelte';
  import GeoJson from './map/GeoJson.svelte';
  import Polyline from './map/Polyline.svelte';
  import Tooltip from './map/Tooltip.svelte';
  import MapControls from './MapControls.svelte';
  import * as topojson from 'topojson-client';
  import { scaleSqrt } from 'd3-scale';
  import makeLineCoordinates from './map/arrows';

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
    latLngs: L.LatLng[];
    color: string;
    weight: number;
    calcLine: () => { arrow: L.LatLng[][] };
  }

  interface Arrow {
    path: L.LatLng[][];
    color: string;
  }

  const baseWeight = 2;
  const weightMultiplier = 5;
  function linesForMsa(map: L.Map, msa: Msa): Line[] {
    if (!map || !msa) {
      return [];
    }

    let centroidLatLng = L.latLng(msa.centroid[1], msa.centroid[0]);

    let incomingLines = msa.incoming.slice(0, 10).map((flow) => {
      let source = msas.get(flow.id)!;
      let sourcePoint = L.latLng(source.centroid[1], source.centroid[0]);
      let calcLine = makeLineCoordinates(map, sourcePoint, centroidLatLng);
      return {
        id: `${msa.id}:${source.id}`,
        latLngs: [sourcePoint, centroidLatLng],
        color: 'hsl(30, 100%, 40%)',
        weight:
          baseWeight + (flow.count / msa.incoming[0].count) * weightMultiplier,
        calcLine,
      };
    });

    let outgoingLines = msa.outgoing.slice(0, 10).map((flow) => {
      let dest = msas.get(flow.id)!;
      let destPoint = L.latLng(dest.centroid[1], dest.centroid[0]);
      let calcLine = makeLineCoordinates(map, centroidLatLng, destPoint);
      return {
        id: `${dest.id}:${msa.id}`,
        latLngs: [centroidLatLng, destPoint],
        color: 'blue',
        weight:
          baseWeight + (flow.count / msa.outgoing[0].count) * weightMultiplier,
        calcLine,
      };
    });

    return [...incomingLines, ...outgoingLines];
  }

  let lineArrows: Arrow[];
  let zoomed = 0;
  $: {
    zoomed;
    lineArrows = lines.map((line) => ({
      path: line.calcLine().arrow,
      color: line.color,
    }));
  }

  $: if (map && !zoomed) {
    zoomed = 1;
    map.addEventListener('zoom', () => zoomed++);
  }

  $: lines = [
    ...linesForMsa(map, clickMsa),
    ...(hoverMsa && hoverMsa !== clickMsa ? linesForMsa(map, hoverMsa) : []),
  ];

  $: hasLines = new Set(lines.flatMap((l) => l.id.split(':')));
  let showLines = true;
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

  <div style="grid-area:map;--dash-length:18">
    <!-- Show the map only once the window has loaded, so that Leaflet gets the sizing right. -->
    {#if loaded || document.readyState === 'complete'}
      <Leaflet bind:map bounds={initialBounds}>
        <MapControls {initialBounds} {msas} {infoMsa} bind:showLines />
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

        {#if showLines}
          {#each lines as line}
            <Polyline
              latLngs={line.latLngs}
              color={line.color}
              weight={line.weight}
              className="animate-dash-offset"
              dashArray="8 10" />
          {/each}

          {#each lineArrows as arrow}
            <Polyline
              latLngs={arrow.path}
              color={arrow.color}
              fillOpacity={1}
              fill={true} />
          {/each}
        {/if}
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
