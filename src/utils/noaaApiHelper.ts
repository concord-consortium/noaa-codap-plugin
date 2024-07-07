import dayjs from "dayjs";
import { IFrequency, IRecord, ITimeZone, IUnits, IWeatherStation } from "../types";
import { frequencyToReportTypeMap, nceiBaseURL } from "../constants";
import { dataTypeStore } from "./noaaDataTypes";

interface IFormatData {
  data: IRecord[];
  units: IUnits;
  frequency: IFrequency;
  weatherStation: IWeatherStation;
  timezone: ITimeZone;
}

const convertUnits = (data: any[]) => {
  const convertedData = data.map(function (item) {
    Object.keys(item).forEach(function (attrName) {
      let dataType = dataTypeStore.findByAbbr(attrName);
      if (dataType && dataType.convertUnits) {
        item[attrName] = dataType.convertUnits(dataType.units.metric, dataType.units.standard, item[attrName]);
      }
    });
    return item;
  });
  console.log("| returning some convertedData:", convertedData);
  return convertedData;
};

export const formatData = (props: IFormatData) => {
  const {data, timezone, frequency, weatherStation, units} = props;
  const database = frequencyToReportTypeMap[frequency];
  let dataRecords: any[] = [];
  data.forEach((r: any) => {
    const aValue = convertNOAARecordToValue(r, weatherStation, database);
    aValue.latitude = weatherStation.latitude;
    aValue.longitude = weatherStation.longitude;
    aValue["UTC offset"] = timezone.gmtOffset;
    aValue.timezone = timezone.name;
    aValue.elevation = weatherStation.elevation || "";
    aValue["report type"] = frequency;
    dataRecords.push(aValue);
  });
  return units === "standard" ? convertUnits(dataRecords) : dataRecords;
};

export const decodeData = (iField: string, iValue: any, database: string) => {
  let dataType = dataTypeStore.findByAbbr(iField);
  let decoder = dataType && dataType.decode && dataType.decode[database];
  return decoder ? decoder(iValue) : iValue;
};

export const convertNOAARecordToValue = (iRecord: IRecord, weatherStation: IWeatherStation, database: string) => {
  let out: IRecord = {};
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
  gmtOffset: string;
}

export const composeURL = (props: IComposeURL) => {
  const { startDate, endDate, frequency, attributes, weatherStation, gmtOffset } = props;
  const database = frequencyToReportTypeMap[frequency];
  const format = "YYYY-MM-DDThh:mm:ss";
  let sDate = dayjs(startDate);
  let eDate = dayjs(endDate);

  // adjust for local station time
  if (database === "global-hourly") {
    sDate = dayjs(startDate).subtract(Number(gmtOffset), "hour");
    eDate = dayjs(endDate).subtract(Number(gmtOffset), "hour").add(1, "day");
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
