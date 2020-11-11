<script lang="ts">
  import * as L from 'leaflet';
  import Control from './map/Control.svelte';
  import type { Msa } from './types';
  import { getContext } from 'svelte';

  const map = getContext<() => L.Map>('map')();

  export let initialBounds: L.LatLngBounds;
  export let msas: Map<string, Msa>;
  export let infoMsa: Msa | undefined = undefined;

  export let showLines = true;
  export let topNFlows = 5;
  export let filterSetting = 'all';
</script>

<style lang="postcss">
  button {
    @apply h-7 w-7 p-1 rounded transition-colors duration-200 text-gray-800 hover:bg-gray-200 hover:text-gray-600 border-gray-900;
  }
</style>
