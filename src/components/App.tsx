import React, { useEffect } from "react";
import { initializePlugin } from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range/date-range";
import { AttributesSelector } from "./attribute-selector";
import { InfoModal } from "./info-modal";
import { StateCounterDemoToBeRemoved } from "./state-counter-demo";
import { useStateContext } from "../hooks/use-state";
import { DataReturnWarning } from "./data-return-warning";
import { adjustStationDataset } from "../utils/getWeatherStations";
import { createStationsDataset } from "../utils/codapConnect";

import weatherStations from "../assets/data/weather-stations.json";
import InfoIcon from "../assets/images/icon-info.svg";

import "./App.scss";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 495
};

export const App = () => {
  const {state, setState} = useStateContext();
  const {showModal} = state;
  //TODO: allow station selection from CODAP and show selected station in CODAP from plugin

  useEffect(() => {
    initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});
    adjustStationDataset(weatherStations); //change max data to "present"
    createStationsDataset(weatherStations); //send weather station data to CODAP
  }, []);

  const handleOpenInfo = () => {
    setState(draft => {
      draft.showModal = "info";
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
        <button className="get-data-button">Get Data</button>
      </div>
      {showModal === "info" && <InfoModal />}
      <StateCounterDemoToBeRemoved />
    </div>
  );
};
