import React, { useEffect } from "react";
import {
  initializePlugin,
} from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range";
import { AttributesSelector } from "./attribute-selector";
import { InfoModal } from "./info-modal";
import InfoIcon from "../assets/images/icon-info.svg";
import { useStateContext } from "../hooks/use-state";
import { DataReturnWarning } from "./data-return-warning";

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

  useEffect(() => {
    initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});
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
    </div>
  );
};
