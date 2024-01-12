import dayjs from "dayjs";
import { IWeatherStation } from "../types";

const stationDatasetFilePath = "../assets/weather-stations.json"; // Replace with the path to your JSON file
export const kStationsDatasetName = "US-Weather-Stations";
export const kStationsCollectionName = "US Weather Stations";

export const kWeatherStationCollectionAttrs = [
  { name: "name" },
  {
      name: "ICAO",
      description: "International Civil Aviation Org. Airport Code"
  },
  {
      name: "mindate",
      type: "date",
      precision: "day",
      description: "Earliest reporting date"
  },
  {
      name: "maxdate",
      type: "date",
      precision: "day",
      description: `Latest reporting date, or "present" if is an active station`
  },
  {
      name: "latitude",
      unit: "º"
  },
  {
      name: "longitude",
      unit: "º"
  },
  {
      name: "elevation",
      unit: "ft",
      precision: "0",
      type: "number"
  },
  { name: "isdID"},
  {
      name: "ghcndID",
      description: "Global Historical Climatology Network ID"
  },
  {
      name: "isActive",
      formula: `(number(maxdate="present"
                  ? date()
                  : date(split(maxdate,'-',1), split(maxdate, ""-", 2), split(maxdate, "-", 3))) - wxMinDate)>0 and wxMaxDate-number(date(split(mindate,"-",1), split(mindate, "-", 2), split(mindate, "-", 3)))>0`,
      description: "whether the station was active in the Weather Plugin's requested date range",
      _categoryMap: {
          __order: [
              "false",
              "true"
          ],
          false: "#a9a9a9",
          true: "#2a4bd7"
      },
  }
];


export const getWeatherStations = async () => {
  try {
    let tResult = await fetch(stationDatasetFilePath);
    if (tResult.ok) {
      return await tResult.json();
    } else {
      let msg = await tResult.text();
      console.warn(`Failure fetching "${stationDatasetFilePath}": ${msg}`);
    }
  } catch (ex) {
    console.warn(`Exception fetching "${stationDatasetFilePath}": ${ex}`);
  }
};

/**
 * We assume that the station dataset was prepared in the past but
 * stations that were active at the time of preparation are still active.
 * If they reported within a week of the dataset"s max date, we mark the
 * max date as "present".
 */
export const adjustStationDataset = (dataset: IWeatherStation[]) => {
  let maxDate: dayjs.Dayjs | null = null;

  maxDate = dataset.reduce((max, station) => {
    const date = dayjs(station.maxdate);
    if (!max || date.isAfter(max)) {
      max = date;
    }
    return max;
  }, null as dayjs.Dayjs | null);

  if (maxDate) {
    const refDate = maxDate.subtract(1, "week");
    dataset.forEach(function (station) {
      let d = dayjs(station.maxdate);
      if (d && d.isAfter(refDate)) {
        station.maxdate = "present";
      }
    });
  }
};

async function findNearestActiveStation(lat, long, fromDate, toDate) {
  if (typeof fromDate === "string") {
    fromDate = new Date(fromDate);
  }
  if (typeof toDate === "string") {
    toDate = new Date(toDate);
  }
  let fromSecs = fromDate/1000;
  let toSecs = toDate/1000;
  let result = await codapConnect.queryCases(constants.StationDSName,
      constants.StationDSTitle,
      `greatCircleDistance(latitude, longitude, ${lat}, ${long})=
      min(greatCircleDistance(latitude, longitude, ${lat}, ${long}),
      ((${fromSecs}<maxdate or maxdate='present') and (${toSecs}>mindate)))`);
  if (result.success) {
    if (Array.isArray(result.values)) {
      // noinspection JSPotentiallyInvalidTargetOfIndexedPropertyAccess
      return result.values[0];
    } else {
      return result.values;
    }
  }
}

async function setNearestActiveStation (location, startDate, endDate) {
  if (!location || !startDate || !endDate) {
    return;
  }
  console.log(`Location: ${JSON.stringify(location)} start: ${startDate}, end: ${endDate}`);
  let nearestStation = await findNearestActiveStation(location.latitude,
      location.longitude, startDate, endDate);
  if (nearestStation) {
    let station = nearestStation.values;
    state.selectedStation = station;
    await codapConnect.selectStations([state.selectedStation.name]);
    await codapConnect.centerAndZoomMap("Map",
        [location.latitude, location.longitude], 9);
    // updateView();
    // updateTimezone(station);
  }
}
