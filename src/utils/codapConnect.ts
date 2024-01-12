import { codapInterface, createDataContext, createItems, createNewCollection } from "@concord-consortium/codap-plugin-api";
import { kStationsCollectionName, kStationsDatasetName, kWeatherStationCollectionAttrs } from "./getWeatherStations";
import { IWeatherStation } from "../types";

export const createStationsDataset = async(stations: IWeatherStation[]) => {
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

export const addNotificationHandler = (action: string, resource: string, handler: (req: any)=>Promise<void>) => {
  codapInterface.on(action, resource, handler);
};

/**
 *
 * @param stationNames {[string]}
 * @return {Promise<void>}
 */
export const selectStations = async(stationNames: any) => {
  if (!stationNames) {
      return;
  }

  const req = stationNames.map((stationName: any) => {
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
}
