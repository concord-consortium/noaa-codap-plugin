import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useStateContext } from "./use-state";
import { frequencyToReportTypeMap, nceiBaseURL } from "../constants";
import { dataTypeStore } from "../utils/noaaDataTypes";
import { IUnits } from "../types";

export const useNOAAApi = () => {
  const { state } = useStateContext();
  const { frequency, weatherStation, attributes } = state;
  const [database, setDatabase] = useState<string>(frequencyToReportTypeMap[frequency]);

  useEffect(() => {
    setDatabase(frequencyToReportTypeMap[frequency]);
  }, [frequency]);

  const convertUnits = (fromUnitSystem: IUnits, toUnitSystem: IUnits, data: any) => {
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

  const formatData = (data: any) => {
    const { stationTimezoneOffset, stationTimezoneName, units } = state;
    let dataRecords: any[] = [];
    data.forEach((r: any) => {
      const aValue = convertNOAARecordToValue(r);
      aValue.latitude = aValue.station.latitude;
      aValue.longitude = aValue.station.longitude;
      aValue["UTC offset"] = stationTimezoneOffset;
      aValue.timezone = stationTimezoneName;
      aValue.elevation = aValue.station.elevation;
      aValue["report type"] = frequency;
      dataRecords.push(aValue);
    });
    convertUnits("metric", units, dataRecords);
    return dataRecords;
  };

  const decodeData = (iField: any, iValue: any) => {
    let dataType = dataTypeStore.findByName(iField);
    let decoder = dataType && dataType.decode && dataType.decode[database];
    return decoder ? decoder(iValue) : iValue;
  };

  const convertNOAARecordToValue = (iRecord: any) => {
    console.log("iRecord", iRecord); // to-do: add interface / type
    let out: any = {}; // to-do: add interface / type
    Object.keys(iRecord).forEach(function (key: any) {
      let value = iRecord[key];
      let dataTypeName;
      switch (key) {
        case "DATE":
          out.utc = value;
          break;
        case "STATION":
          out.station = weatherStation;
          out.where = out.station.name;
          break;
        default:
          dataTypeStore.findAllBySourceName(key).forEach(function (dataType) {
            dataTypeName = dataType.name;
            out[dataTypeName] = decodeData(dataTypeName, value);
          });
      }
    });
    return out;
  };

  const composeURL = () => {
    const {stationTimezoneOffset, startDate, endDate} = state;
    const format = "YYYY-MM-DDThh:mm:ss";
    let sDate;
    let eDate;
    // adjust for local station time
    if (database === "global-hourly" && stationTimezoneOffset) {
        sDate = dayjs(startDate).subtract(stationTimezoneOffset, "hour");
        eDate = dayjs(endDate).subtract(stationTimezoneOffset, "hour").add(1, "day");
    }
    const startDateString = dayjs(sDate).format(format);
    const endDateString = dayjs(eDate).format(format);
    const tDatasetIDClause = `dataset=${database}`;
    const tStationIDClause = `stations=${weatherStation}`;
    const dataTypes = attributes.map(function (attrName) {
        return dataTypeStore.findByName(attrName)?.sourceName;
    }); // to-do: update for when attributes are objects
    const tDataTypeIDClause = `dataTypes=${dataTypes.join()}`;
    const tStartDateClause = `startDate=${startDateString}`;
    const tEndDateClause = `endDate=${endDateString}`;
    const tUnitClause = `units=metric`;
    const tFormatClause = "format=json";

    let tURL = [nceiBaseURL, [tDatasetIDClause, tStationIDClause, tStartDateClause, tEndDateClause, tFormatClause, tDataTypeIDClause, tUnitClause].join(
        "&")].join("?");
    console.log(`Fetching: ${tURL}`);
    return tURL;
  };

  return {composeURL, convertNOAARecordToValue, formatData};
};
