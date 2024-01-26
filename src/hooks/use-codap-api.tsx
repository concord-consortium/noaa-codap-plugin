import { Attribute, Collection, DataContext, IDataType, IItem } from "../types";
import { IResult, codapInterface, createItems, getDataContext } from "@concord-consortium/codap-plugin-api";
import { DSCollection1, DSCollection2, DSName, kStationsCollectionName } from "../constants";
import { useStateContext } from "./use-state";
import { useEffect } from "react";
import { createMap, selectStations } from "../utils/codapHelpers";

export const useCODAPApi = () => {
  const {state} = useStateContext();

  useEffect(() => {
    if (state.weatherStation && state.isMapOpen) {
      const zoom = state.zoomMap ? 7 : null;
      createMap(kStationsCollectionName, {width: 500, height: 350}, [state.weatherStation.latitude, state.weatherStation.longitude], zoom);
      selectStations([state.weatherStation.name]);
    }
  }, [state.isMapOpen, state.weatherStation, state.zoomMap]);

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
  const {units} = state;
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
    const {units} = state;
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
    const { selectedFrequency, frequencies } = state;
    const { attrs, filters } = frequencies[selectedFrequency];
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

  const createNOAAItems = async (items: IItem[], dataTypes: IDataType[]) => {
    await updateWeatherDataset(dataTypes);
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

  return {
    filterItems,
    createNOAAItems
  };
};
