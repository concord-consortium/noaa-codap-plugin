import dayjs from "dayjs";
import { IStation, IWeatherStation } from "../types";
import weatherStations from "../assets/data/weather-stations.json";

/**
 * We assume that the station dataset was prepared in the past but
 * stations that were active at the time of preparation are still active.
 * If they reported within a week of the dataset's max date, we mark the
 * max date as "present".
 */
export const adjustStationDataset = () => {
  const datasetArr = Array.from(weatherStations);
  let maxDate: dayjs.Dayjs | null = null;

  if (datasetArr) {
    maxDate = datasetArr.reduce((max, station) => {
      const date = dayjs(station.maxdate);
      if (!max || date.isAfter(max)) {
        max = date;
      }
      return max;
    }, null as dayjs.Dayjs | null);

    if (maxDate) {
      const refDate = maxDate.subtract(1, "week");
      return datasetArr.map(station => {
        let d = dayjs(station.maxdate);
        if (d && d.isAfter(refDate)) {
          return {...station, maxdate: "present"};
        } else {
          return station;
        }
      });
    }
  }
  return datasetArr;
};

export const findNearestActiveStations = async (targetLat: number, targetLong: number, fromDate: Date,
     toDate: Date) => {
  const adjustedStationDataset = adjustStationDataset();
  const fromMSecs = fromDate.getTime() ;
  const toMSecs = toDate.getTime();
  const nearestStations: IStation[] = [];

  const insertStation = (station: IWeatherStation, distance: number) => {
    const newStation = {station, distance};
    // Insert the new station into the sorted array at the correct position
    const index = nearestStations.findIndex(s => s.distance > distance);
    if (index === -1) {
      nearestStations.push(newStation);
    } else {
      nearestStations.splice(index, 0, newStation);
    }
  };

  for (const station of adjustedStationDataset) {
    let shouldInsert = false;
    if (station.maxdate === "present") {  // If the station is still active (maxdate === "present") then we can use it
      shouldInsert = true;
    } else {  // If the station is not active, we need to check if it has data in the date range
      const stationMinMSecs = new Date(station.mindate).getTime();
      const stationMaxMSecs = new Date(station.maxdate).getTime();
      if (stationMinMSecs <= toMSecs && stationMaxMSecs >= fromMSecs) {
        shouldInsert = true;
      }
    }

    if (shouldInsert) {

      const distance = calculateDistance(targetLat, targetLong, station.latitude, station.longitude);
      const newStation = {station, distance};
      insertStation(newStation.station, newStation.distance);
    }
  }
  return nearestStations;
};

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistance(point1Lat: number, point1Long: number, point2Lat: number, point2Long: number): number {
  const earthRadiusKm = 6371; // Earth radius in kilometers

  const lat1Rad = degreesToRadians(point1Lat);
  const lon1Rad = degreesToRadians(point1Long);
  const lat2Rad = degreesToRadians(point2Lat);
  const lon2Rad = degreesToRadians(point2Long);

  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadiusKm * c;

  return distance; //in km
}

export function getWeatherStations() {
  return weatherStations as IWeatherStation[];
}

export function convertDistanceToStandard(distance: number) {
  return distance * 0.621371;
}
