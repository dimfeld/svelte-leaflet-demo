import * as L from 'leaflet';

const arrowSideLength = 15; // Length of the arrow "wings"
const arrowSideAngle = Math.PI / 8;
// Omit the arrow if the line is shorter than this.
const omitArrowThreshold = 40;
const minArrowSpacing = 200; // in pixels

// The height of the arrow from base to tip.
const arrowHeight = arrowSideLength * Math.sin(arrowSideAngle);

export default function makeLineCoordinates(
  map: L.Map,
  from: L.LatLng,
  to: L.LatLng
) {
  let fromPointOrig = map.latLngToLayerPoint(from);
  let toPointOrig = map.latLngToLayerPoint(to);
  let lineAngle =
    Math.atan2(
      toPointOrig.y - fromPointOrig.y,
      toPointOrig.x - fromPointOrig.x
    ) + Math.PI;

  // Calculate how much to bump the arrow, so that it doesn't look off-center
  // on short lines.
  let xBump = Math.cos(lineAngle) * (arrowHeight / 2);
  let yBump = Math.sin(lineAngle) * (arrowHeight / 2);

  return function calcLine() {
    // Get the current pixel coordinates of the ends of the line.
    let toPoint = map.latLngToLayerPoint(to);
    let fromPoint = map.latLngToLayerPoint(from);

    let lineLength = Math.sqrt(
      (toPoint.x - fromPoint.x) ** 2 + (toPoint.y - fromPoint.y) ** 2
    );

    let numArrows =
      lineLength > omitArrowThreshold
        ? Math.max(Math.floor(lineLength / minArrowSpacing), 1)
        : 0;

    // Move the arrow by this much every time to get evenly spaced arrows.
    let delta = L.point(
      (toPoint.x - fromPoint.x) / (numArrows + 1),
      (toPoint.y - fromPoint.y) / (numArrows + 1)
    );

    // Similar to before, except now we're starting at fromPoint and will
    // add `delta` each time.
    let arrowTipPixels = L.point(fromPoint.x - xBump, fromPoint.y - yBump);

    const calcOffset = (angle: number) => {
      let x = arrowSideLength * Math.cos(angle);
      let y = arrowSideLength * Math.sin(angle);
      return L.point(x, y);
    };

    let leftOffset = calcOffset(lineAngle - arrowSideAngle);
    let rightOffset = calcOffset(lineAngle + arrowSideAngle);

    let arrowPaths = new Array(numArrows);
    for (let i = 0; i < numArrows; ++i) {
      arrowTipPixels = arrowTipPixels.add(delta);

      let arrowTip = map.layerPointToLatLng(arrowTipPixels);
      let leftPoint = map.layerPointToLatLng(arrowTipPixels.add(leftOffset));
      let rightPoint = map.layerPointToLatLng(arrowTipPixels.add(rightOffset));
      arrowPaths[i] = [leftPoint, arrowTip, rightPoint, leftPoint];
    }

    return {
      line: [from, to],
      arrow: arrowPaths,
    };
  };
}
