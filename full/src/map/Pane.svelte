<script lang="ts">
  import { getContext, setContext, onDestroy } from 'svelte';

  export let name: string;
  export let z: number;

  const map = getContext<() => L.Map>('map')();
  const parentPaneName = getContext<string>('pane');
  let parentPane = parentPaneName ? map.getPane(parentPaneName) : undefined;

  let pane = map.createPane(name, parentPane);
  pane.setAttribute('style', `z-index:${z}`);
  setContext('pane', name);
</script>

<slot />
