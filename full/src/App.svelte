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

  let map: Leaflet;
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

  let clickMsa: Msa;
  let hoverMsa: Msa | undefined;

  let hoveringInList = false;
  $: infoMsa = hoverMsa || clickMsa;
  $: listMsa = hoveringInList ? clickMsa : infoMsa;

  let loaded = false;

  interface Line {
    id: string;
    path: (string | [number, number])[];
    color: string;
    animationSpeed: string;
  }

  function linesForMsa(map: L.Map | undefined, msa: Msa, n: number): Line[] {
    if (!map || !msa) {
      return [];
    }

    let centroidLatLng = L.latLng(msa.centroid[1], msa.centroid[0]);

    let incomingLines = msa.incoming.slice(0, n).map((flow) => {
      let source = msas.get(flow.id)!;
      let sourcePoint = L.latLng(source.centroid[1], source.centroid[0]);
      let path = makeLineCoordinates(map, sourcePoint, centroidLatLng, true);
      let percentOfMax = flow.count / msa.incoming[0].count;
      return {
        id: `${msa.id}:${source.id}`,
        path,
        color: 'hsl(30, 100%, 40%)',
        animationSpeed: 1000 + (1 - percentOfMax) * 3000 + 'ms',
      };
    });

    let outgoingLines = msa.outgoing.slice(0, n).map((flow) => {
      let dest = msas.get(flow.id)!;
      let destPoint = L.latLng(dest.centroid[1], dest.centroid[0]);
      let path = makeLineCoordinates(map, centroidLatLng, destPoint, false);
      let percentOfMax = flow.count / msa.outgoing[0].count;
      return {
        id: `${dest.id}:${msa.id}`,
        path,
        color: 'blue',
        animationSpeed: 1000 + (1 - percentOfMax) * 3000 + 'ms',
      };
    });

    return [...incomingLines, ...outgoingLines];
  }

  let topNFlows: number;
  $: lines = [
    ...linesForMsa(map?.getMap(), clickMsa, topNFlows),
    ...(hoverMsa && hoverMsa !== clickMsa
      ? linesForMsa(map?.getMap(), hoverMsa, topNFlows)
      : []),
  ];

  $: hasLines = new Set(lines.flatMap((l) => l.id.split(':')));
  let showLines = true;

  $: allShownMsas = Array.from(
    new Set([...hasLines, ...activeMsas.map((m) => m.id)]),
    (id) => msas.get(id)
  );
</script>

<style>
  #container {
    display: grid;
    grid-template:
      'map' auto
      'controls' 16rem / 100vw;
  }
</style>

<svelte:window on:resize={resizeMap} on:load={() => (loaded = true)} />

<div class="w-screen h-screen" id="container">
  <div style="grid-area:map;--dash-length:18">
    <!-- Show the map only once the window has loaded, so that Leaflet gets the sizing right. -->
    {#if loaded || document.readyState === 'complete'}
      <Leaflet bind:this={map} bounds={initialBounds}>
        <MapControls
          {initialBounds}
          {msas}
          {infoMsa}
          bind:showLines
          bind:topNFlows
          bind:filterSetting />
        {#each allShownMsas as msa (msa.id)}
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

        <Pane name="linePane" z={450}>
          {#if showLines}
            {#each lines as line}
              <Curve
                path={line.path}
                color={line.color}
                className="animate-dash-offset"
                dashArray="8 10"
                style="--animation-speed:{line.animationSpeed}"
                interactive={false} />
            {/each}
          {/if}
        </Pane>
      </Leaflet>
    {/if}
  </div>

  <div
    style="grid-area:controls"
    class="w-full flex text-sm justify-between md:px-12">
    {#if listMsa}
      <div class="px-2 overflow-x-hidden">
        <p class="font-medium text-gray-800">Top Sources</p>
        {#each listMsa.incoming.slice(0, 10) as msa}
          <p
            class="hover:bg-gray-100 cursor-pointer flex"
            on:click={() => (clickMsa = msas.get(msa.id))}
            on:mouseover={() => {
              hoverMsa = msas.get(msa.id);
              hoveringInList = true;
            }}
            on:mouseout={() => (hoverMsa = null)}>
            <span class="truncate">{msas.get(msa.id).name}</span>
            <span class="whitespace-no-wrap">: {msa.count}</span>
          </p>
        {/each}
      </div>

      <div class="px-2 overflow-x-hidden">
        <p class="font-medium text-gray-800">Top Destinations</p>
        {#each listMsa.outgoing.slice(0, 10) as msa}
          <p
            class="hover:bg-gray-100 cursor-pointer flex"
            on:mouseover={() => {
              hoverMsa = msas.get(msa.id);
              hoveringInList = true;
            }}
            on:mouseout={() => (hoverMsa = null)}
            on:click={() => (clickMsa = msas.get(msa.id))}>
            <span class="truncate">{msas.get(msa.id).name}</span>
            <span class="whitespace-no-wrap">: {msa.count}</span>
          </p>
        {/each}
      </div>
    {/if}
  </div>
</div>
