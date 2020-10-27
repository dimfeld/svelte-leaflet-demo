<script lang="ts">
  import * as L from 'leaflet';
  import Control from './map/Control.svelte';
  import type { Msa } from './types';
  import { getContext } from 'svelte';
  import type { Readable } from 'svelte/store';

  const map = getContext<Readable<L.Map>>('map');

  export let initialBounds: L.LatLngBounds;
  export let msas: Map<string, Msa>;
  export let infoMsa: Msa | undefined = undefined;
</script>

<Control position="topright" class="p-2 border border-black bg-white">
  <button
    class="h-7 w-7 p-1 rounded transition-colors duration-200 hover:bg-gray-200 hover:text-gray-600 text-gray-800"
    title="Zoom out to entire country"
    type="button"
    on:click={() => $map.fitBounds(initialBounds)}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor">
      <path
        fill-rule="evenodd"
        d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
        clip-rule="evenodd" />
    </svg>
  </button>
</Control>

{#if infoMsa}
  <Control
    position="bottomleft"
    class="border border-gray-600 px-4 py-2 bg-gray-200 bg-opacity-75">
    <table class="p-2">
      <tr class="py-2">
        <td class="text-right pr-2">Name:</td>
        <td><strong>{infoMsa.name}</strong></td>
      </tr>
      <tr class="py-2">
        <td class="text-right pr-2">Incoming:</td>
        <td>
          <strong>{infoMsa.totalIncoming}
            ({Math.abs((infoMsa.totalIncoming / infoMsa.population) * 100).toFixed(1)}%)</strong>
        </td>
      </tr>
      <tr class="py-2">
        <td class="text-right pr-2">Outgoing:</td>
        <td>
          <strong>{infoMsa.totalOutgoing}
            ({Math.abs((infoMsa.totalOutgoing / infoMsa.population) * 100).toFixed(1)}%)</strong>
        </td>
      </tr>
      <tr class="py-2">
        <td class="text-right pr-2">Net Flow:</td>
        <td>
          <strong>{infoMsa.net}
            ({Math.abs(infoMsa.netAsPercent).toFixed(1)}%)</strong>
        </td>
      </tr>
    </table>
  </Control>
{/if}
