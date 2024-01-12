import React, { useEffect } from "react";
import {
  initializePlugin,
} from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range";
import { AttributesSelector } from "./attribute-selector";
import { InfoModal } from "./info-modal";
import InfoIcon from "../assets/images/icon-info.svg";
import { StateCounterDemoToBeRemoved } from "./state-counter-demo";
import { useStateContext } from "../hooks/use-state";
import { DataReturnWarning } from "./data-return-warning";

import "./App.scss";
import { adjustStationDataset, getWeatherStations, kStationsCollectionName, kStationsDatasetName } from "../utils/getWeatherStations";
import { addNotificationHandler, createStationsDataset, selectStations } from "../utils/codapConnect";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 495
};

export const App = () => {
  const {state, setState} = useStateContext();
  const {showModal} = state;

  useEffect(() => {
    initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});
    getWeatherStations().then(stations => {
      adjustStationDataset(stations);
      createStationsDataset(stations);
    });

    const stationSelectionHandler = async(req: any) => {
      if (req.values.operation === "selectCases") {
        let result = req.values.result;
        let myCase = result && result.cases && result.cases[0];
        if (myCase) {
          // let station = myCase.values;
          state.weatherStation = myCase.values;
          // ui.setTransferStatus('success', 'Selected new weather station');
          // updateView();
          // updateTimezone(station);
        }
      }
    };
    async function noaaWeatherSelectionHandler(req: any) {
      if (req.values.operation === "selectCases") {
        const myCases = req.values.result && req.values.result.cases;
        const myStations = myCases && myCases.filter(function (myCase: any) {
          return (myCase.collection.name === kStationsDatasetName);
        }).map(function (myCase: any) {
          return (myCase.values.where);
        });
        await selectStations(myStations);
      }
    }
    addNotificationHandler("notify",
      `dataContextChangeNotice[${kStationsDatasetName}]`, stationSelectionHandler);

    // Set up notification handler to respond to Weather Station selection
    addNotificationHandler("notify",
      `dataContextChangeNotice[${kStationsDatasetName}]`, noaaWeatherSelectionHandler);
  }, []);

  const handleOpenInfo = () => {
    setState(draft => {
      draft.showModal = "info";
    });
  };

  const handleGetData = () => {
    // for now just show the warning
    setState(draft => {
      draft.showModal = "data-return-warning";
    });
  };

  return (
    <div className="App">
      <div className="header">
        <span>Retrieve weather data from observing stations.</span>
        <InfoIcon title="Get further information about this CODAP plugin" onClick={handleOpenInfo}/>
      </div>
      <div className="header-divider" />
      <LocationPicker />
      <div className="divider" />
      <DateRange />
      <div className="divider" />
      <AttributesSelector />
      <div className="divider" />
      <div className="footer">
        <button className="clear-data-button">Clear Data</button>
        <button className="get-data-button" onClick={handleGetData}>Get Data</button>
      </div>
      {showModal === "info" && <InfoModal />}
      {showModal === "data-return-warning" && <DataReturnWarning />}
      <StateCounterDemoToBeRemoved />
    </div>
  );
};
