# Svelte and Leaflet Demo

This is a demo application using Svelte and Leaflet to visualize the US Census "Metro Area-to-Metro Area Migration Flows” dataset.

This repository contains two versions of the application. The `full` directory is the
finished product, while the `skeleton` directory just contains a basic shell, which I
fill in during the presentation to build into the complete app.

Developed for a presentation to JavascriptLA on November 11, 2020.



## References

### Concepts

* [Metropolitan Statistcal Areas (US Census)](https://www.census.gov/topics/housing/housing-patterns/about/core-based-statistical-areas.html)
* [Wikipedia on MSAs](https://en.wikipedia.org/wiki/Metropolitan_statistical_area)
* [Creating Consistently Curved Lines in Leaflet](https://medium.com/@ryancatalani/creating-consistently-curved-lines-on-leaflet-b59bc03fa9dc)
* [geojson.io](https://geojson.io) for playing with GeoJSON.

### Software

* [Svelte](https://svelte.dev)
* [Leaflet](https://leafletjs.com/)
* [Tailwind CSS](https://tailwindcss.com)
* [Leaflet Curve Plugin](https://github.com/elfalem/Leaflet.curve)
* [TopoJSON](https://github.com/topojson/topojson)
* [Turf.js](https://turfjs.org/) for manipulating GeoJSON

### Data

* [MSA Migration Data](https://www.census.gov/data/tables/2018/demo/geographic-mobility/metro-to-metro-migration.html)
    * Specifically [this file](https://www2.census.gov/programs-surveys/demo/tables/geographic-mobility/2018/metro-to-metro-migration/metro-to-metro-2014-2018.xlsx)
* [Shape data for MSAs](https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html)
    * We used [cb_2018_us_cbsa_500k.zip](https://www2.census.gov/geo/tiger/GENZ2018/shp/cb_2018_us_cbsa_500k.zip)
    * And converted from ESRI Shapefile to TopoJson using [MapShaper](https://mapshaper.org/)
