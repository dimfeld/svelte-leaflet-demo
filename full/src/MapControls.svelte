<script lang="ts">
  import Control from './map/Control.svelte';
  import type { Msa } from './types';

  export let msas: Map<string, Msa>;
  export let infoMsa: Msa | undefined = undefined;
</script>

<Control
  position="topright"
  class="border border-gray-600 px-4 py-2 bg-yellow-100 bg-opacity-50">
  This is a control
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
