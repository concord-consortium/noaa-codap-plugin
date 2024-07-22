/* eslint-env node */

/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
const fs = require("fs");
const console = require("console");
const process = require("process");
const path = require("path");
/* eslint-enable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */

const kDeltaSq = 0.0001; // distance in degrees within which two stations are considered the same.


function configure() {
  let configuration = {};

  configuration.progName = process.argv[1].replace(/.*\//, '');

  let isdStationsFile = process.argv[2];
  if (!(isdStationsFile && fs.existsSync(isdStationsFile) ) ) {
    usage(configuration);
  }
  configuration.isdStationsFile = isdStationsFile;

  let ghcndStationsFile = process.argv[3];
  if (ghcndStationsFile && !fs.existsSync(ghcndStationsFile)) {
    printErrorAndExit(`${configuration.progName}: File doesn't exist: ${ghcndStationsFile}`);
  }
  configuration.ghcndStationsFile = ghcndStationsFile;
  return configuration;
}

function dist (x1, y1, x2, y2) {
  return ((x1-x2)*(x1-x2)) + ((y1-y2)*(y1-y2));
}

function printErrorAndExit(message, code) {
  console.error(message);
  process.exit(code || 1);
}

function usage(configuration) {
  printErrorAndExit(`usage: ${configuration.progName} isd_stations.json [ghcnd_stations.json]`, 2);
}


// haversine distance implementation from https://github.com/dcousens/haversine-distance/blob/main/index.js
// This is a way to get a distance between two points on a sphere (Earth) given their latitudes and longitudes.
const R = 6378137; // equatorial mean radius of Earth (in meters)

function squared (x) { return x * x }
function toRad (x) { return x * Math.PI / 180.0 }
function hav (x) {
  return squared(Math.sin(x / 2));
}

// hav(theta) = hav(bLat - aLat) + cos(aLat) * cos(bLat) * hav(bLon - aLon)
function haversineDistance (a, b) {
  const aLat = toRad(Array.isArray(a) ? a[1] : a.latitude ?? a.lat);
  const bLat = toRad(Array.isArray(b) ? b[1] : b.latitude ?? b.lat);
  const aLng = toRad(Array.isArray(a) ? a[0] : a.longitude ?? a.lng ?? a.lon);
  const bLng = toRad(Array.isArray(b) ? b[0] : b.longitude ?? b.lng ?? b.lon);

  const ht = hav(bLat - aLat) + Math.cos(aLat) * Math.cos(bLat) * hav(bLng - aLng);
  return 2 * R * Math.asin(Math.sqrt(ht));
}

// Station matching constants
const MAX_DISTANCE_KM = 3.5;
const MAX_ELEVATION_DIFF = 50;

function findMatching(stationList, candidateStation) {
  return stationList.find(function (station) {
    // Check ICAO match first (if available)
    if (station.ICAO && candidateStation.ICAO && station.ICAO === candidateStation.ICAO) {
      return true;
    }

    if (station.name === candidateStation.name) {
      return true;
    }


    // Calculate distance using Haversine formula
    const distance = haversineDistance(station, candidateStation) / 1000; // Convert meters to kilometers

    // Check if distance is within threshold
    if (distance > MAX_DISTANCE_KM) {
      return false;
    }

    const candidateElevationInMeters = getElevationsFromMetersString(candidateStation.elevation);
    const stationElevationInMeters = getElevationsFromMetersString(station.elevation);
    // If within distance threshold, lets make sure we don't have too big an elevation difference
    const elevationDiff = Math.abs(stationElevationInMeters - candidateElevationInMeters);
    return elevationDiff <= MAX_ELEVATION_DIFF;
  });
}


function getElevationsFromMetersString(elevation) {
  if (!elevation) return 0;
  if (isFinite(elevation)) return elevation;

  elevation = elevation.trim();
  const isNegative = elevation.startsWith("-");
  if (elevation.startsWith("+") || isNegative) {
    elevation = elevation.substring(1);
  }
  const elevationInMeters = parseFloat(elevation);
  const rawMeters = isNegative ? -elevationInMeters : elevationInMeters;
  const meters = Math.round(rawMeters);
  return meters;
}

function combineTwoStations(st1, st2) {
  st1.ranges = st1.ranges.concat(st2.ranges);
  if (!st1.ICAO && st2.ICAO){
    st1.ICAO = st2.ICAO;
  }
  if (st2.isdID) {
    st1.isdID = `${st1.isdID},${st2.isdID}`;
  }
  if (st2.ghcndID) {
    if (st1.ghcndID) {
      st1.ghcndID += "," + st2.ghcndID;
    } else {
      st1.ghcndID = st2.ghcndID;
    }
  }
  if (Date.parse(st2.mindate) < Date.parse(st1.mindate)) {
    st1.mindate = st2.mindate;
  }
  // contents of base record reflect the latest activation of the station
  if (Date.parse(st2.maxdate) > Date.parse(st1.maxdate)) {
    st1.maxdate = st2.maxdate;
    st1.latitude = st2.latitude;
    st1.longitude = st2.longitude;
    st1.elevation = st2.elevation;
    st1.name = st2.name;
  }

  return st1;
}


function consolidateISDStations(rawStations) {
  let mergedStations = [];
  rawStations.forEach(function (rawStation) {
    let normalizedStation = normalizeISDStation(rawStation);
    let existingStation = findMatching(mergedStations, normalizedStation);
    if (normalizedStation.latitude) {
      if (existingStation) {
        combineTwoStations(existingStation, normalizedStation);
      } else {
        mergedStations.push(normalizedStation);
      }
    }
  });
  return mergedStations;
}

function normalizeISDStation(st) {
  return {
    country: st.country,
    state: st.state,
    latitude: st.latitude,
    longitude: st.longitude,
    name: st.name,
    elevation: st.elevation,
    ICAO: st.ICAO,
    mindate: st.mindate,
    maxdate: st.maxdate,
    isdID: st.id,
    ranges: [
      {
        mindate: st.mindate,
        maxdate: st.maxdate,
        latitude: st.latitude,
        longitude: st.longitude,
        name: st.name,
        elevation: st.elevation,
        ids: [
          {type: "USAF", id: st.USAF},
          {type: "WBAN", id: st.WBAN},
          {type: "ICAO", id: st.ICAO},
          {type: "isdID", id: st.id},
        ]
      }
    ]
  };
}

function normalizeGHCNDStation(st) {
  let id = st.id.replace("GHCND:", "");
  return {
    latitude: st.latitude,
    longitude: st.longitude,
    name: st.name,
    elevation: st.elevation,
    mindate: st.mindate,
    maxdate: st.maxdate,
    ghcndID: id,
    ranges: [
      {
        mindate: st.mindate,
        maxdate: st.maxdate,
        latitude: st.latitude,
        longitude: st.longitude,
        name: st.name,
        elevation: st.elevation,
        ids: [
          {type: "GHCND", id},
        ]
      }
    ]
  };
}

function removeTransientStations(stations) {
  let minLifespan = 1000*60*60*24*365;
  return stations.filter(function (station) {
    return (Date.parse(station.maxdate) - Date.parse(station.mindate) > minLifespan);
  });
}

function writeDebugToFile(variable, customName = null) {
  const variableName = customName || Object.keys({ variable })[0];
  const fileName = `${variableName}.json`;
  const filePath = path.join("/tmp", fileName);
  console.error(` ... Writing ${fileName} (${variable.length} items) to file: ${filePath}`);
  fs.writeFileSync(filePath, JSON.stringify(variable, null, 2));
}



module.exports = {
  dist,
  configure,
  normalizeGHCNDStation,
  normalizeISDStation,
  removeTransientStations,
  printErrorAndExit,
  writeDebugToFile,
  getElevationsFromMetersString,
  findMatching,
  consolidateISDStations,
  combineTwoStations
};
