import dayjs from "dayjs";
import { IFrequency, IRecord, IUnits, IWeatherStation } from "../types";
import { frequencyToReportTypeMap, nceiBaseURL } from "../constants";
import { dataTypeStore } from "./noaaDataTypes";

export const convertUnits = (fromUnitSystem: IUnits, toUnitSystem: IUnits, data: any) => {
  if (fromUnitSystem === toUnitSystem) {
    return;
  }
  data.forEach(function (item: any) {
    Object.keys(item).forEach(function (prop) {
      let dataType = dataTypeStore.findByName(prop);
      if (dataType && dataType.convertUnits) {
        item[prop] = dataType.convertUnits(dataType.units[fromUnitSystem], dataType.units[toUnitSystem], item[prop]);
      }
    });
  });
};

interface IFormatData {
  data: IRecord[];
  stationTimezoneOffset?: number;
  stationTimezoneName?: string;
  units: IUnits;
  frequency: IFrequency;
  weatherStation: IWeatherStation;
}

export const formatData = (props: IFormatData) => {
  const {data, stationTimezoneOffset, stationTimezoneName, units, frequency, weatherStation} = props;
  const database = frequencyToReportTypeMap[frequency];
  let dataRecords: any[] = [];
  data.forEach((r: any) => {
    const aValue = convertNOAARecordToValue(r, weatherStation, database);
    aValue.latitude = weatherStation.latitude;
    aValue.longitude = weatherStation.longitude;
    aValue["UTC offset"] = stationTimezoneOffset || "";
    aValue.timezone = stationTimezoneName || "";
    aValue.elevation = weatherStation.elevation;
    aValue["report type"] = frequency;
    dataRecords.push(aValue);
  });
  convertUnits("metric", units, dataRecords);
  return dataRecords;
};

export const decodeData = (iField: string, iValue: any, database: string) => {
  let dataType = dataTypeStore.findByName(iField);
  let decoder = dataType && dataType.decode && dataType.decode[database];
  return decoder ? decoder(iValue) : iValue;
};

export const convertNOAARecordToValue = (iRecord: IRecord, weatherStation: IWeatherStation, database: string) => {
  let out: IRecord = {}; // to-do: add interface / type
  Object.keys(iRecord).forEach(function (key: any) {
    let value = iRecord[key];
    let dataTypeName;
    switch (key) {
      case "DATE":
        out.utc = value as Date;
        break;
      case "STATION":
        out.station = weatherStation;
        out.where = weatherStation?.name || "";
        break;
      default:
        dataTypeStore.findAllBySourceName(key).forEach(function (dataType) {
          dataTypeName = dataType.name;
          out[dataTypeName] = decodeData(dataTypeName, value, database);
        });
    }
  });
  return out;
};

export const getSelectedStations = (database: string, weatherStation: IWeatherStation) => {
  let id = database === "global-hourly" ? "isdID" : "ghcndID" as keyof IWeatherStation;
  return [weatherStation[id]];
};

interface IComposeURL {
  startDate: Date;
  endDate: Date;
  frequency: IFrequency;
  attributes: string[];
  weatherStation: IWeatherStation;
  stationTimezoneOffset?: number;
}

export const composeURL = (props: IComposeURL) => {
  const { startDate, endDate, frequency, attributes, weatherStation, stationTimezoneOffset } = props;
  const database = frequencyToReportTypeMap[frequency];
  const format = "YYYY-MM-DDThh:mm:ss";
  let sDate = dayjs(startDate);
  let eDate = dayjs(endDate);
  // adjust for local station time
  if (database === "global-hourly" && stationTimezoneOffset) {
      sDate = dayjs(startDate).subtract(stationTimezoneOffset, "hour");
      eDate = dayjs(endDate).subtract(stationTimezoneOffset, "hour").add(1, "day");
  }
  const startDateString = dayjs(sDate).format(format);
  const endDateString = dayjs(eDate).format(format);
  const tDatasetIDClause = `dataset=${database}`;
  const tStationIDClause = `stations=${getSelectedStations(database, weatherStation).join()}`;
  const dataTypes = attributes.map(function (attrName) {
      return dataTypeStore.findByName(attrName)?.sourceName;
  });
  const tDataTypeIDClause = `dataTypes=${dataTypes.join()}`;
  const tStartDateClause = `startDate=${startDateString}`;
  const tEndDateClause = `endDate=${endDateString}`;
  const tUnitClause = `units=metric`;
  const tFormatClause = "format=json";

  let tURL = [nceiBaseURL, [tDatasetIDClause, tStationIDClause, tStartDateClause, tEndDateClause, tFormatClause, tDataTypeIDClause, tUnitClause].join(
      "&")].join("?");
  // eslint-disable-next-line no-console
  console.log(`Fetching: ${tURL}`);
  return tURL;
};
