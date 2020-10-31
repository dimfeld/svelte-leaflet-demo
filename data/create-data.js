#!/usr/bin/env node
const dsv = require('d3-dsv');
const fs = require('fs');
const topojson = require('topojson-client');
const topojsonServer= require('topojson-server');
const turf = require('@turf/turf');

function formatNumber(s) {
    return +s.replace(/,/g, '');
}

let metroData = dsv.csvParseRows(fs.readFileSync('input/metro-to-metro-2014-2018.csv').toString(), (row, i) => {
    if(i < 4) {
        // SKip useless header rows.
        return;
    }

    if(row[0].length !== 5) {
        // Skip footer data and blank rows at the end
        return;
    }

    return {
        destination: {
            id: row[0].toString().padStart(5, '0'),
            population: formatNumber(row[3]),
            totalIncoming: formatNumber(row[9]),
        },
        source: {
            id: row[1].toString().padStart(5, '0'),
            population: formatNumber(row[16]),
            totalOutgoing: formatNumber(row[22]),
        },
        flow: formatNumber(row[26]),
    };
});

console.log(`Got ${metroData.length} rows`);

let topoData = JSON.parse(fs.readFileSync('input/input-topo.json'));

let geojson = topojson.feature(topoData, 'cb_2018_us_cbsa_500k');
let msaData = new Map();

for(let feature of geojson.features) {
    let centroid;

    if(feature.geometry.type === 'MultiPolygon') {
        // For MultiPolygons, find the area of the largest polygon and use the centroid
        // of that one. This is mostly to make Oahu look correct, for which the GeoJSON
        // has a lot of huge outliers.
        let largest = feature.geometry.coordinates.map((c) => {
            let poly = turf.polygon(c);
            return {
                area: turf.area(poly),
                poly,
            }
        }).sort((a, b) => b.area - a.area);

        centroid = turf.centerOfMass(largest[0].poly);
    } else {
        centroid = turf.centerOfMass(feature);
    }


    msaData.set(feature.properties.CBSAFP, {
        id: feature.properties.CBSAFP,
        centroid: centroid.geometry.coordinates
    });
}

let flowMap = new Map();
let missingGeo = new Set();

for(let {source, destination, flow} of metroData) {
    let reverse = destination.id < source.id;
    let flowKey = reverse ? `${destination.id}:${source.id}` : `${source.id}:${destination.id}`;
    let flowAmount = reverse ? -flow : flow;

    flowMap.set(flowKey, (flowMap.get(flowKey) || 0) + flowAmount);

    let sourceData = msaData.get(source.id);
    if(!sourceData) {
        missingGeo.add(source.id);
    } else {
        sourceData.population = source.population;
        sourceData.totalOutgoing = source.totalOutgoing;
    }

    let destData = msaData.get(destination.id);
    if(!destData) {
        missingGeo.add(destination.id);
    } else {
        destData.totalIncoming = destination.totalIncoming;
        destData.population = destination.population;
    }
}

let flows = Array.from(flowMap.entries(), ([key, count]) => {
    return [...key.split(':'), count];
});

// Just a sanity check to make sure we're including everything relevant.
// console.log(Array.from(missingGeo));

let msaOutput = Array.from(msaData.values()).filter((msa) => msa.population > 0);
let presentMsas = new Set(msaOutput.map((m) => m.id));
let presentFeatures = geojson.features.filter((f) => presentMsas.has(f.properties.CBSAFP));
let outputGeojson = {
    ...geojson,
    features: presentFeatures,
};


console.log(`Saving ${msaOutput.length} MSAs`);
fs.writeFileSync('flows.json', JSON.stringify(flows));
fs.writeFileSync('msas.json', JSON.stringify(msaOutput));

// A lot of the MSAs in the topojson don't show up in the data, so regenerate the topojson with only
// the ones we use, to save space.
let outputTopo = topojsonServer.topology({ msas: outputGeojson }, 1e4);
fs.writeFileSync('topo.json', JSON.stringify(outputTopo));
