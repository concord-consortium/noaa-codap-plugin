import {
  kUnitTypeAngle,
  kUnitTypeDistance,
  kUnitTypePrecip,
  kUnitTypePressure,
  kUnitTypeSpeed,
  kUnitTypeTemp }
from "../constants";
import { ConverterMap, Unit, UnitMap } from "../types";

const unitMap: UnitMap = {
    angle: { metric: "º", standard: "º" },
    distance: { metric: "m", standard: "yd" },
    precipitation: { metric: "mm", standard: "in" },
    pressure: { metric: "hPa", standard: "hPa" },
    speed: { metric: "m/s", standard: "mph" },
    temperature: { metric: "°C", standard: "°F" },
};

const converterMap: ConverterMap = {
    angle: null,
    distance: null,
    temperature: convertTemp,
    precipitation: convertPrecip,
    speed: convertWindspeed,
    pressure: null
};

function convertPrecip(fromUnit: Unit, toUnit: Unit, value: number) {
    let k = 25.4;
    if (!convertible(value)) {
        return value;
    } else if (fromUnit === "mm" && toUnit === "in") {
        return value / k;
    } else if (fromUnit === "in" && toUnit === "mm") {
        return value * k;
    } else {
        return value;
    }
}

function convertTemp(fromUnit: Unit, toUnit: Unit, value: number) {
    if (!convertible(value)) {
        return value;
    } else if (fromUnit === "°C" && toUnit === "°F") {
        return 1.8*value + 32;
    } else if (fromUnit === "°F" && toUnit === "°C") {
        return (value - 32) / 1.8;
    } else {
        return value;
    }
}

function convertWindspeed(fromUnit: Unit, toUnit: Unit, value: number) {
    let k=0.44704;
    if (!convertible(value)) {
        return value;
    } else if (fromUnit === "m/s" && toUnit === "mph") {
        return value / k;
    } else if (fromUnit === "mph" && toUnit === "m/s") {
        return value * k;
    } else {
        return value;
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
  convertUnits: null | ((fromUnit: Unit, toUnit: Unit, value: number) => number);

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
  new NoaaType("AWND", "avgWind", kUnitTypeSpeed, "Average windspeed",
      ["daily-summaries", "global-summary-of-the-month"], {
      "GHCND" (v: number) {return v/10;}, "GSOM" (v) {return v/10;}
  }),
  new NoaaType("DEW", "Dew", kUnitTypeTemp, "Dew Point",
      ["global-hourly"], {"global-hourly": extractHourlyTemp}),
  new NoaaType("SLP", "Pressure", kUnitTypePressure,
      "Barometric Pressure at sea level", ["global-hourly"],
      {"global-hourly": extractHourlyPressure}),
  new NoaaType("TMP", "Temp", kUnitTypeTemp, "Air Temperature",
      ["global-hourly"], {"global-hourly": extractHourlyTemp}),
  new NoaaType("VIS", "Vis", kUnitTypeDistance, "Visibility",
      ["global-hourly"], {"global-hourly": extractHourlyVisibility}),
  new NoaaType("WND", "WDir", kUnitTypeAngle, "Wind Direction",
      ["global-hourly"], {"global-hourly": extractHourlyWindDirection}),
  new NoaaType("WND", "WSpeed", kUnitTypeSpeed, "Wind Speed",
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

function findByName(targetName: string) {
  return dataTypes.find(function (dataType) {
      return targetName === dataType.name;
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
};

export {NoaaType, dataTypeStore};
