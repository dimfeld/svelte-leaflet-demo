import { SvelteComponent } from 'svelte';
import * as L from 'leaflet';

export function bindPopup(
  layer: L.Layer,
  popup?: string | typeof SvelteComponent,
  props?: object
) {
  if (!popup) {
    return;
  }

  if (typeof popup === 'string') {
    layer.bindPopup(popup);
  } else {
    let popupComponent: SvelteComponent | undefined;
    layer.bindPopup(() => {
      let container = L.DomUtil.create('div');
      popupComponent = new popup({
        target: container,
        props: { ...(props || {}) },
      });
      return container;
    });

    layer.on('popupclose', () => {
      if (popupComponent) {
        let old = popupComponent;
        popupComponent = undefined;
        // Wait for the popup to completely fade out before destroying it.
        // Otherwise the fade out looks weird as the contents disappear too early.
        setTimeout(() => {
          old.$destroy();
        }, 500);
      }
    });
  }
}
