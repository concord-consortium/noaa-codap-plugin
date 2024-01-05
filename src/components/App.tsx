import React, { useEffect, useState } from "react";
import {
  createDataContext,
  createItems,
  createNewCollection,
  createTable,
  getAllItems,
  getDataContext,
  initializePlugin,
  addComponentListener,
  ClientNotification,
} from "@concord-consortium/codap-plugin-api";
import "./App.scss";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range";
import { AttributesSelector } from "./attribute-selector";
import { InfoModal } from "./info-modal";
import InfoIcon from "../assets/icon-info.svg";
import { StateCounterDemoToBeRemoved } from "./state-counter-demo";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 495
};
const kDataContextName = "WeatherData";

export const App = () => {
  const [codapResponse, setCodapResponse] = useState<any>(undefined);
  const [listenerNotification, setListenerNotification] = useState<string>();
  const [dataContext, setDataContext] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});

    // this is an example of how to add a notification listener to a CODAP component
    // for more information on listeners and notifications, see
    // https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API#documentchangenotice
    const createTableListener = (listenerRes: ClientNotification) => {
      if (listenerRes.values.operation === "open case table") {
        setListenerNotification("A case table has been created");
      }
    };
    addComponentListener(createTableListener);
  }, []);

  const handleOpenTable = async () => {
    const res = await createTable(dataContext, kDataContextName);
    setCodapResponse(res);
  };

  const handleCreateData = async() => {
    const existingDataContext = await getDataContext(kDataContextName);
    let createDC, createNC, createI;
    if (!existingDataContext.success) {
      createDC = await createDataContext(kDataContextName);
      setDataContext(createDC.values);
    }
    if (existingDataContext?.success || createDC?.success) {
      createNC = await createNewCollection(kDataContextName, "Pets", [{name: "type", type: "string"}, {name: "number", type: "number"}]);
      createI = await createItems(kDataContextName, [ {type: "dog", number: 5},
                                      {type: "cat", number: 4},
                                      {type: "fish", number: 20},
                                      {type: "horse", number: 1},
                                      {type: "bird", number: 8},
                                      {type: "hamster", number: 3}
                                    ]);
    }

    setCodapResponse(`Data context created: ${JSON.stringify(createDC)}
    New collection created: ${JSON.stringify(createNC)}
    New items created: ${JSON.stringify(createI)}`
                    );
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
        <button className="get-data-button">Get Data</button>
      </div>
      {showInfo &&
        <InfoModal setShowInfo={setShowInfo}/>
      }
      <StateCounterDemoToBeRemoved />
    </div>
  );
};
