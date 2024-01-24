import dayjs from "dayjs";
import { IStation, IWeatherStation } from "../types";
import weatherStations from "../assets/data/weather-stations.json";

/**
 * We assume that the station dataset was prepared in the past but
 * stations that were active at the time of preparation are still active.
 * If they reported within a week of the dataset"s max date, we mark the
 * max date as "present".
 */
export const adjustStationDataset = (dataset: IWeatherStation[]) => {
  const datasetArr = Array.from(dataset);

  let maxDate: dayjs.Dayjs | null = null;

  if (dataset) {
    maxDate = datasetArr.reduce((max, station) => {
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
  }
};

export const findNearestActiveStations = async(targetLat: number, targetLong: number, fromDate: number | string,
     toDate: number | string) => {
  // TODO: filter out weather stations that are active
  // let nearestStation: IWeatherStation | null = null;
  // let minDistance = Number.MAX_VALUE;
  let nearestStations: IStation[] = [];

  for (const station of weatherStations as IWeatherStation[]) {
    const distance = calculateDistance(targetLat, targetLong, station.latitude, station.longitude);
    const newStation = {station, distance};

    // Insert the new station into the sorted array at the correct position
    const index = nearestStations.findIndex(s => s.distance > distance);
    if (index === -1) {
      nearestStations.push(newStation);
    } else {
      nearestStations.splice(index, 0, newStation);
    }
    // if (distance < minDistance) {
    //   minDistance = distance;
    //   nearestStation = station;
    // }
  }

  return nearestStations.slice(0, 5);
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
