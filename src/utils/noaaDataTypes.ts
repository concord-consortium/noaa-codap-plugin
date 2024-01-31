import {
  kUnitTypeAngle,
  kUnitTypeDistance,
  kUnitTypePrecip,
  kUnitTypePressure,
  kUnitTypeSpeed,
  kUnitTypeTemp,
} from "../constants";
import { Unit, unitMap } from "../types";

type ConvertUnitsFunc = (fromUnit: Unit, toUnit: Unit, value: string) => number;
interface ConverterMap {
  [key: string]: null | ConvertUnitsFunc;
}

const converterMap: ConverterMap = {
    angle: null,
    distance: null,
    temperature: convertTemp,
    precipitation: convertPrecip,
    speed: convertWindspeed,
    pressure: null
};

function convertPrecip(fromUnit: Unit, toUnit: Unit, value: string) {
  let k = 25.4;
  const numValue = Number(value);
  if (!convertible(value)) {
    return numValue;
  } else if (fromUnit === "mm" && toUnit === "in") {
    return numValue / k;
  } else if (fromUnit === "in" && toUnit === "mm") {
    return numValue * k;
  } else {
    return numValue;
  }
}

function convertTemp(fromUnit: Unit, toUnit: Unit, value: string) {
  const numValue = Number(value);
  if (!convertible(value)) {
    return numValue;
  } else if (fromUnit === "°C" && toUnit === "°F") {
    return (1.8 * numValue) + 32;
  } else if (fromUnit === "°F" && toUnit === "°C") {
    return (numValue - 32) / 1.8;
  } else {
    return numValue;
  }
}

function convertWindspeed(fromUnit: Unit, toUnit: Unit, value: string) {
  const numValue = Number(value);
  let k=0.44704;
  if (!convertible(value)) {
    return numValue;
  } else if (fromUnit === "m/s" && toUnit === "mph") {
    return numValue / k;
  } else if (fromUnit === "mph" && toUnit === "m/s") {
    return numValue * k;
  } else {
    return numValue;
  }
}

function formatNthCurry(n: number, separator: string, multiplier: number) {
  return function (v: any) {
    if (!v) {
        return;
    }
    let value = v.split(separator)[n];
    // if all nines, interpret as empty
    if (/^\+?9*$/.test(value)) {
        return;
    }
    if (isNaN(value)) {
        return;
    }
    if (!isNaN(value)) {
      return Number(value) * multiplier;
    }
  };
}

const extractHourlyTemp = formatNthCurry(0, ",", .1);
const extractHourlyVisibility = formatNthCurry(0, ",", 1);
const extractHourlyPressure = formatNthCurry(0, ",", .1);
const extractHourlyWindDirection = formatNthCurry(0, ",", 1);
const extractHourlyWindspeed = formatNthCurry(3, ",", .1);
function extractHourlyPrecipitation (value: any) {
  let parts = value.split(",");
  let period = Number(parts[0]);
  let depth = Number(parts[1]);
  if (Number(period) !== 1) {
      return;
  }
  return depth * .1;
}

class NoaaType {
  sourceName: string;
  name: string;
  units: { metric: Unit; standard: Unit; };
  description: string;
  datasetList: string[];
  decode: undefined | ({ [key: string]: (value: any) => number|undefined });
  convertUnits: null | ConvertUnitsFunc;

  constructor(
      sourceName: string,
      name: string,
      unitType: string,
      description: string,
      datasetList: string[],
      decoderMap?: { [key: string]: (value: any) => number|undefined },
  ) {
      this.sourceName = sourceName;
      this.name = name;
      this.units = unitMap[unitType];
      this.description = description;
      this.datasetList = datasetList;
      this.decode = decoderMap;
      this.convertUnits = converterMap[unitType];
  }

  isInDataSet(dataSet: string): boolean {
      return this.datasetList.indexOf(dataSet) >= 0;
  }
}

const dataTypes = [
  // {sourceName, name, unitType, description, datasetList, decoderMap}
  new NoaaType("TMAX", "tMax", kUnitTypeTemp, "Maximum temperature",
      ["daily-summaries", "global-summary-of-the-month"]),
  new NoaaType("TMIN", "tMin", kUnitTypeTemp, "Minimum temperature",
      ["daily-summaries", "global-summary-of-the-month"]),
  new NoaaType("TAVG", "tAvg", kUnitTypeTemp, "Average temperature",
      ["daily-summaries", "global-summary-of-the-month"]),
  new NoaaType("PRCP", "precip", kUnitTypePrecip, "Precipitation",
      ["daily-summaries", "global-summary-of-the-month"]),
  new NoaaType("SNOW", "snow", kUnitTypePrecip, "Snowfall",
      ["daily-summaries", "global-summary-of-the-month"]),
  new NoaaType("AWND", "avgWind", kUnitTypeSpeed, "Average wind speed",
      ["daily-summaries", "global-summary-of-the-month"], {
      "GHCND" (v: number) {return v/10;}, "GSOM" (v) {return v/10;}
  }),
  new NoaaType("DEW", "dew", kUnitTypeTemp, "Dew Point",
      ["global-hourly"], {"global-hourly": extractHourlyTemp}),
  new NoaaType("SLP", "pressure", kUnitTypePressure,
      "Barometric Pressure at sea level", ["global-hourly"],
      {"global-hourly": extractHourlyPressure}),
  new NoaaType("TMP", "temp", kUnitTypeTemp, "Air temperature",
      ["global-hourly"], {"global-hourly": extractHourlyTemp}),
  new NoaaType("VIS", "vis", kUnitTypeDistance, "Visibility",
      ["global-hourly"], {"global-hourly": extractHourlyVisibility}),
  new NoaaType("WND", "WDir", kUnitTypeAngle, "Wind direction",
      ["global-hourly"], {"global-hourly": extractHourlyWindDirection}),
  new NoaaType("WND", "wSpeed", kUnitTypeSpeed, "Wind speed",
      ["global-hourly"], {"global-hourly": extractHourlyWindspeed}),
  new NoaaType("AA1", "Precip", kUnitTypePrecip, "Precipitation in last hour",
      ["global-hourly"], {"global-hourly": extractHourlyPrecipitation}),
];

function convertible(value: any) {
  return !(isNaN(value) || (typeof value === "string" && value.trim() === ""));
}

function findAllBySourceName(targetName: string) {
  return dataTypes.filter(function (dataType) {
    return targetName === dataType.sourceName;
  });
}

function findByAbbr (abbr: string) {
  return dataTypes.find(function (dataType) {
    return abbr === dataType.name;
  });
}

function findByName(targetName: string) {
  return dataTypes.find(function (dataType) {
      return targetName === dataType.description;
  });
}

function findAllByNoaaDataset(noaaDatasetName: string) {
  return dataTypes.filter(function (noaaType) {
      return noaaType.isInDataSet(noaaDatasetName);
  });
}

function findAll() {
  return dataTypes;
}

const dataTypeStore = {
  findAllBySourceName,
  findByName,
  findAllByNoaaDataset,
  findAll,
  findByAbbr
};

export {NoaaType, dataTypeStore};
