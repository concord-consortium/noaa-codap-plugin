import dayjs from "dayjs";
const today = dayjs(dayjs().format("MM/DD/YYYY"));
export const defaultNoaaDataset = "daily-summaries";
export const defaultStation =   {
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
  };
export const defaultStationTimezoneOffset = -5;
export const defaultStationTimezoneName = "EST";
export const defaultDates = {
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
  };
export const defaultCoords = {
    latitude: 44.27,
    longitude: -71.303
  };
export const defaultUnitSystem = "standard";
export const dimensions = {height: 490, width: 380};
export const DSName = "NOAA-Weather";
export const DSTitle = "NOAA Weather";
export const DSCollection1 = "NOAA-Weather";
export const DSCollection2 = "Observations";
export const geonamesUser = "codap";
export const globalMinDate = "wxMinDate";
export const globalMaxDate = "wxMaxDate";
export const noaaBaseURL = "https://www.ncdc.noaa.gov/cdo-web/api/v2/"; // may be obsolescent
export const noaaToken = "rOoVmDbneHBSRPVuwNQkoLblqTSkeayC"; // may be obsolescent
export const nceiBaseURL = "https://www.ncei.noaa.gov/access/services/data/v1";
export const recordCountLimit = 1000; // may be obsolescent
export const reportTypeMap = {
    "daily-summaries": "daily",
    "global-summary-of-the-month": "monthly",
    "global-hourly": "hourly",
    "global-summary-of-the-day": "daily"
  };
export const stationDatasetURL = "./assets/data/weather-stations.json";
export const StationDSName = "US-Weather-Stations";
export const StationDSTitle = "US Weather Stations";
export const timezoneServiceURL = "https://secure.geonames.org/timezoneJSON";
export const version = "v0013";


export const frequencyToReportTypeMap = {
  "daily": "daily-summaries",
  "hourly": "global-hourly",
  "monthly": "global-summary-of-the-month"
};

export const kUnitTypeAngle = "angle";
export const kUnitTypeDistance = "distance";
export const kUnitTypePrecip = "precipitation";
export const kUnitTypePressure = "pressure";
export const kUnitTypeSpeed = "speed";
export const kUnitTypeTemp = "temperature";

export const defaultDataTypes = [
    "tMax",
    "tMin",
    "tAvg",
    "precip",
    "snow",
    "avgWind",
    "Dew",
    "Vis",
    "Temp",
    "Pressure",
    "WSpeed",
    "WDir",
    "Precip"
];

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
      type: "numeric",
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
                  : date(split(maxdate,'-',1), split(maxdate, "-", 2), split(maxdate, "-", 3))) - wxMinDate)>0 and wxMaxDate-number(date(split(mindate,"-",1), split(mindate, "-", 2), split(mindate, "-", 3)))>0`,
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

export const kOffsetMap = {
  "-4": "AST",
  "-5": "EST",
  "-6": "CST",
  "-7": "MST",
  "-8": "PST",
  "-9": "AKST",
  "-10": "HST"
};
