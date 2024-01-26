
import { IResult, codapInterface, getDataContext, createItems,
  IDimensions, getCaseBySearch, getAllItems, getCaseByFormulaSearch,
  createDataContext, createNewCollection} from "@concord-consortium/codap-plugin-api";
import { IWeatherStation, ILatLong, IMapComponent } from "../types";
import { StationDSName, StationDSTitle, kStationsCollectionName,
  kStationsDatasetName, kWeatherStationCollectionAttrs } from "../constants";

const selectComponent = async (id: string) => {
  return await codapInterface.sendRequest({
      action: "notify",
      resource: `component[${id}]`,
      values: {request: "select"
      }
  }) as IResult;
};

const hasDataset = async (name: string) => {
   const result = await getDataContext(name);
   return result.success === true;
};

const createMap = async (name: string, dimensions: IDimensions, center: ILatLong, zoom: number | null) => {
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
      console.warn(`Dataset, "${kStationsDatasetName}", creation failed`);
      return;
  }

  result = await createNewCollection(kStationsDatasetName, kStationsCollectionName, kWeatherStationCollectionAttrs);
  if (!result.success) {
    console.warn(`Collection, "${kStationsCollectionName}", creation failed`);
    return;
  }

  result = await createItems(kStationsDatasetName, stations);
  return result;
};

const addNotificationHandler = (action: string, resource: string, handler: (req: any)=>Promise<void>) => {
  codapInterface.on(action, resource, handler);
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
  createMap,
  createStationsDataset,
  deleteAttributes,
  getAllItems,
  guaranteeGlobal,
  hasDataset,
  hasMap,
  queryCases,
  selectStations,
  findStationByID,
  getAllItemValues
};
