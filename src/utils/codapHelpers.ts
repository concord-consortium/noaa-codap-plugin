
import { IResult, codapInterface, getDataContext, createItems,
  IDimensions, getCaseBySearch, getAllItems, getCaseByFormulaSearch,
  createDataContext, createNewCollection} from "@concord-consortium/codap-plugin-api";
import { Collection, DataContext, IDataType, IWeatherStation,
  IUnits, Attribute, ILatLong, IMapComponent } from "../types";
import { DSName, DSCollection1, DSCollection2, StationDSName, StationDSTitle,
  kStationsCollectionName, kStationsDatasetName, kWeatherStationCollectionAttrs } from "../constants";

const selectComponent = async (id: string) => {
  return await codapInterface.sendRequest({
      action: "notify",
      resource: `component[${id}]`,
      values: {request: "select"
      }
  }) as IResult;
};

const createAttribute = (datasetName: string, collectionName: string, dataType: IDataType, unitSystem: IUnits) => {
   return codapInterface.sendRequest({
       action: "create",
       resource: "dataContext[" + datasetName + "].collection[" + collectionName + "].attribute",
       values: {
           name: dataType.name,
           unit: dataType.units[unitSystem],
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

async function updateWeatherDataset(dataTypes: IDataType[], unitSystem: IUnits) {
   const getDatasetMsg = {
       action: "get",
       resource: `dataContext[${DSName}]`
   };
   let result = await codapInterface.sendRequest(getDatasetMsg) as IResult;
   if (!result || !result.success) {
        result = await codapInterface.sendRequest({
           action: "create",
           resource: "dataContext",
           values: getNoaaDataContextSetupObject()
       }) as IResult;
       if (result.success) {
           result = await codapInterface.sendRequest(getDatasetMsg) as IResult;
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
           return createAttribute(DSName, lastCollection.name, dataType, unitSystem);
       } else {
           let unit = dataType.units[unitSystem];
           if (attrDef.unit !== unit) {
               return updateAttributeUnit(dataSetDef, attrName, unit);
           } else {
               return Promise.resolve("Unknown attribute.");
           }
       }
   });
   return Promise.all(promises);
}

const hasDataset = async (name: string) => {
   const result = await getDataContext(name);
   return result.success === true;
};

const createMap = async (name: string, dimensions: IDimensions, center: ILatLong, zoom: number) => {
   let map;

   let componentListResult = await codapInterface.sendRequest({
       action: "get",
       resource: "componentList"
   }) as IResult;

   if (componentListResult && componentListResult.success) {
       map = componentListResult.values.find(function (component: Record<string, string>) { return component.type==="map";});
   }

   if (!map) {
       let result = await codapInterface.sendRequest({
           action: "create", resource: "component", values: {
               type: "map",
               name,
               dimensions,
               dataContextName: name,
               legendAttributeName: "isActive"
           }
       }) as IResult;
       if (result.success) {
           map = result.values;
       }
   }
   if (map && center && (zoom != null)) {
       return centerAndZoomMap(map.id, center, zoom);
   } else {
       return selectComponent(map.id);
   }
};

const centerAndZoomMap = (mapName: string, center: ILatLong, zoom: number) => {
   return new Promise<void>((resolve) => {
       setTimeout(function () {
           codapInterface.sendRequest({
               action: "update",
               resource: `component[${mapName}]`,
               values: {
                   center,
                   zoom: 4
               }
           });
           setTimeout(function () {
               codapInterface.sendRequest({
                   action: "update",
                   resource: `component[${mapName}]`,
                   values: {
                       zoom
                   }
               });

           }, 500);
       }, 2000);
       resolve();
   });
};

const hasMap = async () => {
   const componentsResult = await codapInterface.sendRequest({
       action: "get",
       resource: "componentList"
   }) as IResult;
   return componentsResult
       && componentsResult.success
       && componentsResult.values.find(function (component: IMapComponent) {
           return component.type === "map";
       });
};

const createStationsDataset = async (stations: IWeatherStation[]) => {
  let result = await createDataContext(kStationsDatasetName);
  if (!result.success) {
      console.log(`Dataset, "${kStationsDatasetName}", creation failed`);
      return;
  }

  result = await createNewCollection(kStationsDatasetName, kStationsCollectionName, kWeatherStationCollectionAttrs);
  if (!result.success) {
    console.log(`Collection, "${kStationsCollectionName}", creation failed`);
    return;
  }

  result = await createItems(kStationsDatasetName, stations);
  return result;
};

const addNotificationHandler = (action: string, resource: string, handler: (req: any)=>Promise<void>) => {
  codapInterface.on(action, resource, handler);
};

const arrayify = (value: any) => {
  return Array.isArray(value) ? value : [value];
};

const createNOAAItem = async (dsName: string, iValues: any, dataTypes: IDataType[], unitSystem: IUnits) => {
   await updateWeatherDataset(dataTypes, unitSystem);
   const items = arrayify(iValues);
   console.log("noaa-cdo ... createNOAAItems with " + iValues.length + " case(s)");
   await createItems(dsName, items);

   await codapInterface.sendRequest({
       "action": "create",
       "resource": "component",
       "values": {
           "type": "caseTable",
           "dataContext": dsName,
           "horizontalScrollOffset": 500
       }
   });
};

const findStationByID = async (stationID: string) => {
   const result = await getCaseBySearch(StationDSName, StationDSTitle, `id==${stationID}`);
   if (result.success) {
       return result.values;
   }
};

const selectStations = async(stationNames: string[]) => {
  if (!stationNames) {
      return;
  }

  const req = stationNames.map((stationName: string) => {
     return {
         action: "get",
         resource: `dataContext[${kStationsDatasetName}].collection[${kStationsCollectionName}].caseSearch[name==${stationName}]`
     };
  });
  const reply = (await codapInterface.sendRequest(req)) as unknown as any[];
  const selectionList = reply.filter((r: any) => {
          return r && r.success;
      }).map((r: any) => {
          return r.values[0].id;
      });
  await codapInterface.sendRequest({
      action: "create",
      resource: `dataContext[${kStationsDatasetName}].selectionList`,
      values: selectionList
  });
};

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

const clearData = async (datasetName: string) =>{
   let result = await getDataContext(datasetName);
   if (result.success) {
       let dc = result.values;
       let lastCollection = dc.collections[dc.collections.length-1];
       return await codapInterface.sendRequest({
           action: "delete",
           resource: `dataContext[${datasetName}].collection[${lastCollection.name}].allCases`
       });
   } else {
       return Promise.resolve({success: true});
   }
};

const deleteAttributes = async (datasetName: string, collectionName: string, attributeNames: string[]) => {
   let attrDeletePromises = attributeNames.map(function (attrName) {
       return codapInterface.sendRequest({
           action: "delete",
           resource: `dataContext[${datasetName}].collection[${collectionName}].attribute[${attrName}]`
       });
   });
   return await (Promise as any).allSettled(attrDeletePromises).then(() => {return {success: true};});
};

const getAllItemValues = async (datasetName: string) => {
   let result = await getDataContext(datasetName);

   if (!result) {
       return [];
   }

   result = await getAllItems(datasetName);

   if (result && result.success) {
       return result.values.map(function (item: any) {return item.values;});
   }
};

const queryCases = async (dataset: string, collection: string, query: string) => {
  return await getCaseByFormulaSearch(dataset, collection, query);
};

const guaranteeGlobal = async (name: string, value: any) => {
  return (codapInterface.sendRequest({
      action: "get",
      resource: `global[${name}]`
  }) as Promise<IResult>).then(result => {
    if (result.success) {
        return codapInterface.sendRequest({
            action: "update",
            resource: `global[${name}]`,
            values: {
                value
            }
        });
    } else {
        return codapInterface.sendRequest({
            action: "create",
            resource: "global",
            values: {
                name,
                value
            }
        });
    }
  }, (msg) => Promise.reject(msg));
};

export {
   addNotificationHandler,
   centerAndZoomMap,
   clearData,
   createAttribute,
   createMap,
   createNOAAItem,
   createStationsDataset,
   deleteAttributes,
   getAllItems,
   guaranteeGlobal,
   hasDataset,
   hasMap,
   queryCases,
   selectStations,
   updateWeatherDataset
};
