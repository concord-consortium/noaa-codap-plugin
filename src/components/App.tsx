import React, { useEffect, useState } from "react";
import {
  createDataContext,
  createTable,
  getDataContext,
  initializePlugin,
} from "@concord-consortium/codap-plugin-api";
import "./App.scss";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range";
import { AttributesSelector } from "./attribute-selector";
import { InfoModal } from "./info-modal";
import InfoIcon from "../assets/images/icon-info.svg";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 495
};
const kDataContextName = "WeatherData";

export const App = () => {
  const [dataContext, setDataContext] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});
  }, []);

  const handleOpenTable = async () => {
    await createTable(dataContext, kDataContextName);
  };

  const handleCreateData = async() => {
    const existingDataContext = await getDataContext(kDataContextName);
    let createDC;
    if (!existingDataContext.success) {
      createDC = await createDataContext(kDataContextName);
      setDataContext(createDC.values);
    }
  };

  const handleGetData = () => {
    handleCreateData();
    handleOpenTable();
  };

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
        <button className="get-data-button" onClick={handleGetData}>Get Data</button>
      </div>
      {showInfo &&
        <InfoModal setShowInfo={setShowInfo}/>
      }
    </div>
  );
};
