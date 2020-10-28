<script lang="ts">
  import type { Readable } from 'svelte/store';
  import {
    createEventDispatcher,
    getContext,
    setContext,
    onDestroy,
  } from 'svelte';
  import { writable } from 'svelte/store';
  import * as L from 'leaflet';
  import flush from 'just-flush';

  export let latLngs: L.LatLngExpression[] | L.LatLngExpression[][];
  export let color: string;
  export let weight: number | undefined = undefined;
  export let opacity: number | undefined = undefined;
  export let lineCap:
    | 'butt'
    | 'round'
    | 'square'
    | 'inherit'
    | undefined = undefined;
  export let lineJoin:
    | 'round'
    | 'inherit'
    | 'miter'
    | 'bevel'
    | undefined = undefined;
  export let fill: boolean | undefined = undefined;
  export let fillColor: string | undefined = undefined;
  export let className: string | undefined = undefined;
  export let dashArray: string | undefined = undefined;
  export let dashOffset: string | undefined = undefined;
  export let fillOpacity: number | undefined = undefined;
  export let fillRule:
    | 'inherit'
    | 'nonzero'
    | 'evenodd'
    | undefined = undefined;

  const dispatch = createEventDispatcher();

  let layerGroup = getContext<Readable<L.LayerGroup>>('layerGroup');
  export let line: L.Polyline | undefined = undefined;

  let layerStore = writable<L.Polyline | undefined>(line);
  setContext('layer', line);

  $: lineStyle = flush({
    color,
    className,
    weight,
    opacity,
    dashArray,
    dashOffset,
    lineCap,
    lineJoin,
    fill,
    fillColor,
    fillOpacity,
    fillRule,
  });

  $: if ($layerGroup && !line) {
    line = new L.Polyline(latLngs, { ...lineStyle, interactive: false })
      .on('click', (e) => dispatch('click', e))
      .on('mouseover', (e) => dispatch('mouseover', e))
      .on('mouseout', (e) => dispatch('mouseout', e))
      .addTo($layerGroup);
    layerStore.set(line);
  }

  onDestroy(() => {
    if (line) {
      line.remove();
      line = undefined;
    }
  });

  $: line?.setStyle(lineStyle);
  $: if (line) {
    line.setLatLngs(latLngs);
    line.redraw();
  }
</script>
