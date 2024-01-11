import React, { useEffect, useState } from "react";
import { initializePlugin } from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range";
import { AttributesSelector } from "./attribute-selector";
import { InfoModal } from "./info-modal";
import InfoIcon from "../assets/icon-info.svg";
import { StateCounterDemoToBeRemoved } from "./state-counter-demo";
import { useStateContext } from "../hooks/use-state";
import { IFrequency } from "../types";

import "./App.scss";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 495
};
const kDataContextName = "WeatherData";

export const App = () => {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});
  }, []);

  const handleOpenInfo = () => {
    setShowInfo(true);
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
      {showInfo &&
        <InfoModal setShowInfo={setShowInfo}/>
      }
      <StateCounterDemoToBeRemoved />
    </div>
  );
};
