import dayjs from "dayjs";

const today = dayjs(dayjs().format("MM/DD/YYYY"));
export const constants = {
  defaultNoaaDataset: "daily-summaries",
  defaultStation:   {
    "country":"US",
    "state":"NH",
    "latitude":44.27,
    "longitude":-71.303,
    "name":"MT. WASHINGTON OBSERVATORY",
    "elevation":6272,
    "ICAO":"KMWN",
    "mindate":"1973-01-01",
    "maxdate":"present",
    "isdID":"72613014755,72613099999",
    "ghcndID": "USW00014755"
  },
  defaultStationTimezoneOffset: -5,
  defaultStationTimezoneName: "EST",
  defaultDates: {
    "hourly": {
      start: today.subtract(4, "week").toDate(),
      end: today.subtract(1, "day").toDate()
    },
    "daily": {
      start: today.subtract(4, "month").toDate(),
      end: today.subtract(1, "day").toDate()
    },
    "monthly": {
      start: today.subtract(10, "year").toDate(),
      end: today.subtract(1, "day").toDate()
    }
  },
  defaultCoords: {
    latitude: 44.27,
    longitude: -71.303
  },
  defaultUnitSystem: "standard",
  dimensions: {height: 490, width: 380},
  DSName: "NOAA-Weather",
  DSTitle: "NOAA Weather",
  DSCollection1: "NOAA-Weather",
  DSCollection2: "Observations",
  geonamesUser: "codap",
  globalMinDate: "wxMinDate",
  globalMaxDate: "wxMaxDate",
  noaaBaseURL: "https://www.ncdc.noaa.gov/cdo-web/api/v2/", // may be obsolescent
  noaaToken: "rOoVmDbneHBSRPVuwNQkoLblqTSkeayC", // may be obsolescent
  nceiBaseURL: "https://www.ncei.noaa.gov/access/services/data/v1",
  recordCountLimit: 1000, // may be obsolescent
  reportTypeMap: {
    "daily-summaries": "daily",
    "global-summary-of-the-month": "monthly",
    "global-hourly": "hourly",
    "global-summary-of-the-day": "daily"
  },
  stationDatasetURL: "./assets/data/weather-stations.json",
  StationDSName: "US-Weather-Stations",
  StationDSTitle: "US Weather Stations",
  timezoneServiceURL: "https://secure.geonames.org/timezoneJSON",
  version: "v0013",
};
