import { useEffect, useState } from "react";
import { useStateContext } from "./use-state";
import { Attribute, Collection, DataContext, ICODAPItem, IDataType, IItem } from "../types";
import { IResult, codapInterface, createItems, getAllItems, getDataContext } from "@concord-consortium/codap-plugin-api";
import { DSCollection1, DSCollection2, DSName, kStationsDatasetName } from "../constants";
import { clearData, createMap, selectStations } from "../utils/codapHelpers";
import { dataTypeStore } from "../utils/noaaDataTypes";

export const useCODAPApi = () => {
  const {state} = useStateContext();
  const [ selectedDataTypes, setSelectedDataTypes ] = useState<IDataType[]>([]);
  const { frequencies, selectedFrequency, weatherStation, units, isMapOpen, zoomMap } = state;
  const { attrs } = frequencies[selectedFrequency];

  useEffect(() => {
    if (weatherStation && isMapOpen) {
      const zoom = zoomMap ? 7 : null;
      createMap(kStationsDatasetName, {width: 500, height: 350}, [weatherStation.latitude, weatherStation.longitude], zoom);
      selectStations([weatherStation.name]);
    }
  }, [isMapOpen, weatherStation, zoomMap]);

  useEffect(() => {
    const attributes = frequencies[selectedFrequency].attrs.map(attr => attr.name);
    const dataTypes = attributes.map((attr) => {
      return dataTypeStore.findByName(attr);
    }) as IDataType[];
    setSelectedDataTypes(dataTypes);
  }, [selectedFrequency, frequencies, attrs]);

  const createNOAAItems = async (items: IItem[]) => {
    await updateWeatherDataset(selectedDataTypes);
    // eslint-disable-next-line no-console
    console.log("noaa-cdo ... createNOAAItems with " + items.length + " case(s)");
    await createItems(DSName, items);
    await codapInterface.sendRequest({
      "action": "create",
      "resource": "component",
      "values": {
        "type": "caseTable",
        "dataContext": DSName,
        "horizontalScrollOffset": 500
      }
    });
  };

  useEffect(() => {
    const updateUnitsInCODAP = async () => {
      let doesDataCtxExist = await getDataContext(DSName);
      if (!doesDataCtxExist || !doesDataCtxExist.success) {
        return;
      }
      const oldUnits = units === "metric" ? "standard" : "metric";
      // fetch existing items in existing dataset
      let allItemsRes = await getAllItems(DSName);
      let allItems = allItemsRes.values.map((item: {id: string, values: ICODAPItem}) => item.values);
      // convert from old units to new units
      allItems.forEach(function (item: ICODAPItem) {
        Object.keys(item).forEach(function (attrName) {
          let dataType = dataTypeStore.findByAbbr(attrName);
          if (dataType && dataType.convertUnits) {
            item[attrName] = dataType.convertUnits(dataType.units[oldUnits], dataType.units[units], item[attrName]);
          }
        });
      });
      // clear dataset
      await clearData(DSName);
      // insert items
      await createNOAAItems(allItems);
    };
    updateUnitsInCODAP();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  const getNoaaDataContextSetupObject = () => {
    return {
        name: DSName,
        title: DSName,
        description: "Data from NOAA",
        collections: [{
            name: DSCollection1,
            labels: {
                singleCase: "station", pluralCase: "stations",
            },
            attrs: [
                {name: "where", type: "categorical", description: "weather station"},
                {name: "latitude", type: "numeric", unit: "º", description: "Latitude of weather station"},
                {name: "longitude", type: "numeric", unit: "º", description: "Longitude of weather station"},
                {name: "UTC offset", type: "numeric", unit: "hours", description: "Station standard time offset from UTC"},
                {name: "timezone", type: "categorical", description: "Timezone of weather station"},
                {name: "elevation", type: "numeric", description: "Elevation of weather station", unit: "ft", precision: 0},
                {name: "report type", type: "categorical", description: "Daily summary or monthly summary"}
            ]
        },
        {
            name: DSCollection2,
            parent: DSCollection1,
            labels: {
                singleCase: "observation",
                pluralCase: "observations",
                setOfCasesWithArticle: "a group of records"
            },
            attrs: [
                {
                    name: "when",
                    type: "date",
                    description: "When the observation occurred in weather station's standard time",
                    formula: 'if(`report type`="hourly",date(utc + (`UTC offset`*3600)), utc)'
                },
                {
                    name: "utc",
                    type: "date",
                    hidden: true,
                    description: "When the observation occurred in UTC"
                },
            ]
        }],
        metadata: {
            source: "https://www.ncei.noaa.gov/access/services/data/v1",
            "import date": new Date().toLocaleString(),
            description: "Historical weather data fetched from NOAA. Note that " +
                'the attribute "utc" has been hidden.'
        }
    };
 };

 const createAttribute = (datasetName: string, collectionName: string, dataType: IDataType) => {
  return codapInterface.sendRequest({
    action: "create",
    resource: "dataContext[" + datasetName + "].collection[" + collectionName + "].attribute",
    values: {
        name: dataType.name,
        unit: dataType.units[units],
        description: dataType.description
      }
    });
  };

  const updateAttributeUnit = (datasetDef: DataContext, attrName: string, unit: string) => {
    let collection = datasetDef.collections.find(function (coll) {
        return coll.attrs.find(function (attr) {
            return attr.name === attrName;
        });
    });

    if (collection) {
     let resource = `dataContext[${datasetDef.name}].collection[${collection.name}].attribute[${attrName}]`;
     return codapInterface.sendRequest({
         action: "update",
         resource,
         values: {
             unit
         }
     });
    }
 };

  const updateWeatherDataset = async (dataTypes: IDataType[]) => {
    let result = await getDataContext(DSName);

    if (!result || !result.success) {
         result = await codapInterface.sendRequest({
            action: "create",
            resource: "dataContext",
            values: getNoaaDataContextSetupObject()
        }) as IResult;

        if (result.success) {
          result = await getDataContext(DSName);
        }
    }
    if (!result.success) {
        throw new Error("Could not find or create NOAA-Weather dataset");
    }

    const dataSetDef = result.values;
    const attrDefs: Attribute[] = [];

    dataSetDef.collections.forEach(function (collection: Collection) {
      collection.attrs.forEach(function (attr) {
          attrDefs.push(attr);
      });
    });

    const lastCollection = dataSetDef.collections[dataSetDef.collections.length - 1];
    const promises = dataTypes.map(function (dataType) {
      const attrName = dataType.name;
      const attrDef = attrDefs.find(function (ad) {
          return ad.name === attrName;
      });
      if (!attrDef) {
          return createAttribute(DSName, lastCollection.name, dataType);
      } else {
          let unit = dataType.units[units];
          if (attrDef.unit !== unit) {
              return updateAttributeUnit(dataSetDef, attrName, unit);
          } else {
              return Promise.resolve("Unknown attribute.");
          }
      }
    });
    return Promise.all(promises);
  };

  const filterItems = (items: IItem[]) => {
    const { filters } = frequencies[selectedFrequency];
    const filteredItems = items.filter((item: IItem) => {
      const allFiltersMatch: boolean[] = [];
      filters.forEach((filter) => {
        const { attribute, operator } = filter;
        const attrKey = attrs.find((attr) => attr.name === attribute)?.abbr;
        if (attrKey) {
          const itemValue = Number(item[attrKey]);
          if (operator === "equals") {
            allFiltersMatch.push(itemValue === filter.value);
          } else if (operator === "doesNotEqual") {
            allFiltersMatch.push(itemValue !== filter.value);
          } else if (operator === "greaterThan") {
            allFiltersMatch.push(itemValue > filter.value);
          } else if (operator === "lessThan") {
            allFiltersMatch.push(itemValue < filter.value);
          } else if (operator === "greaterThanOrEqualTo") {
            allFiltersMatch.push(itemValue >= filter.value);
          } else if (operator === "lessThanOrEqualTo") {
            allFiltersMatch.push(itemValue <= filter.value);
          } else if (operator === "between") {
            const { lowerValue, upperValue } = filter;
            allFiltersMatch.push(itemValue > lowerValue && itemValue < upperValue);
          } else if (operator === "top" || operator === "bottom") {
            const sortedItems = items.sort((a, b) => {
              return Number(b[attrKey]) - Number(a[attrKey]);
            });
            const end = operator === "top" ? filter.value : sortedItems.length;
            const itemsToCheck = sortedItems.slice(end - filter.value, end);
            allFiltersMatch.push(itemsToCheck.includes(item));
          } else if (operator === "aboveMean" || operator === "belowMean") {
            const mean = items.reduce((acc, i) => acc + Number(i[attrKey]), 0) / items.length;
            const expression = operator === "aboveMean" ? itemValue > mean : itemValue < mean;
            allFiltersMatch.push(expression);
          }
        }
      });
      return allFiltersMatch.every((match) => match === true);
    });
    return filteredItems;
  };

  return {
    filterItems,
    createNOAAItems
  };
};
