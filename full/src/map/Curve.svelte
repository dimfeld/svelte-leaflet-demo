<script lang="ts">
  import * as L from 'leaflet';
  import { curve } from './leaflet.curve';

  import {
    createEventDispatcher,
    getContext,
    setContext,
    onDestroy,
  } from 'svelte';
  import flush from 'just-flush';

  export let path: (string | [number, number])[];
  export let color: string;
  export let weight: number | undefined = undefined;
  export let opacity: number | undefined = undefined;
  export let pane: string | undefined = undefined;
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
  export let interactive = true;
  export let style: string | undefined = undefined;

  const dispatch = createEventDispatcher();

  let layerPane = pane || getContext<string>('pane');

  let layerGroup = getContext<() => L.LayerGroup>('layerGroup')();
  // @ts-ignore
  export let line = (curve(
    path,
    flush({
      interactive,
      className,
      pane: layerPane,
    })
  ) as L.Path)
    .on('click', (e) => dispatch('click', e))
    .on('mouseover', (e) => dispatch('mouseover', e))
    .on('mouseout', (e) => dispatch('mouseout', e))
    .addTo(layerGroup);

  setContext('layer', () => line);

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

  onDestroy(() => {
    line.remove();
  });

  $: if (style) {
    line.getElement()?.setAttribute('style', style);
  }

  $: line.setStyle(lineStyle);

  $: {
    // @ts-ignore
    line.setPath(path);
    line.redraw();
  }
</script>

<slot />
