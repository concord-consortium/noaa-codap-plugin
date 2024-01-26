import React, { useState, useEffect } from "react";
import { initializePlugin } from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range/date-range";
import { AttributesSelector } from "./attribute-selector";
import { AttributeFilter } from "./attribute-filter";
import { InfoModal } from "./info-modal";
import { useStateContext } from "../hooks/use-state";
import { adjustStationDataset, getWeatherStations } from "../utils/getWeatherStations";
import { createStationsDataset } from "../utils/codapHelpers";
import InfoIcon from "../assets/images/icon-info.svg";
import { useCODAPApi } from "../hooks/use-codap-api";
import { dataTypeStore } from "../utils/noaaDataTypes";
import { composeURL, formatData } from "../utils/noaaApiHelper";
import { IDataType } from "../types";
import { DataReturnWarning } from "./data-return-warning";

import "./App.scss";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 650
};

export const App = () => {
  const { state, setState } = useStateContext();
  const { filterItems, createNOAAItems } = useCODAPApi();
  const [statusMessage, setStatusMessage] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const { showModal } = state;
  const weatherStations = getWeatherStations();

  useEffect(() => {
    initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});
  }, []);

  useEffect(() => {
    adjustStationDataset(weatherStations); //change max data to "present"
    createStationsDataset(weatherStations); //send weather station data to CODAP
  },[weatherStations]);

  const handleOpenInfo = () => {
    setState(draft => {
      draft.showModal = "info";
    });
  };

  const getSelectedDataTypes = () => {
    const { selectedFrequency } = state;
    const attributes = state.frequencies[selectedFrequency].attrs.map(attr => attr.name);
    return attributes.map((attr) => {
      return dataTypeStore.findByName(attr);
    }) as IDataType[];
  };

  const fetchSuccessHandler = async (data: any) => {
    const {startDate, endDate, units, selectedFrequency,
      weatherStation, timezone} = state;
    const allDefined = (startDate && endDate && units && selectedFrequency &&
      weatherStation && timezone);

    if (data && allDefined) {
      const formatDataProps = {
        data,
        timezone,
        weatherStation,
        frequency: selectedFrequency,
        startDate,
        endDate,
        units
      };
      const dataRecords = formatData(formatDataProps);
      const items = Array.isArray(dataRecords) ? dataRecords : [dataRecords];
      const filteredItems = filterItems(items);
      setStatusMessage("Sending weather records to CODAP");
      await createNOAAItems(filteredItems, getSelectedDataTypes()).then(
        function (result: any) {
          setIsFetching(false);
          setStatusMessage(`Retrieved ${filteredItems.length} cases`);
          return result;
        },
        function (msg: string) {
          setIsFetching(false);
          setStatusMessage(msg);
        }
      );
    } else {
      setIsFetching(false);
      setStatusMessage("No data retrieved");
    }
  };

  const fetchErrorHandler = (message: string, resultText: string) => {
    if (resultText && resultText.length && (resultText[0] === "<")) {
      try {
        let xmlDoc = new DOMParser().parseFromString(resultText, "text/xml");
        message = xmlDoc.getElementsByTagName("userMessage")[0].innerHTML;
        message += "(" + xmlDoc.getElementsByTagName(
            "developerMessage")[0].innerHTML + ")";
      } catch (e: any) {
        console.warn("Error parsing XML: " + e);
      }
    }
    console.warn("fetchErrorHandler: " + resultText);
    console.warn("fetchErrorHandler error: " + message);
    setIsFetching(false);
    setStatusMessage(message);
  };

  const handleGetData = async () => {
    const { location, startDate, endDate, weatherStation, frequencies,
      selectedFrequency, timezone } = state;
    const attributes = frequencies[selectedFrequency].attrs.map(attr => attr.name);
    const allDefined = (startDate && endDate && location && weatherStation && timezone);

    if (allDefined) {
      const isEndDateAfterStartDate = endDate.getTime() >= startDate.getTime();
      if (isEndDateAfterStartDate) {
        setStatusMessage("Fetching weather records from NOAA");
        const tURL = composeURL({
          startDate,
          endDate,
          frequency: selectedFrequency,
          weatherStation,
          attributes,
          gmtOffset: timezone.gmtOffset
        });
        try {
          const tRequest = new Request(tURL);
          const tResult = await fetch(tRequest, {mode: "cors"});
          setIsFetching(true);
          if (tResult.ok) {
            const theJSON = await tResult.json();
            await fetchSuccessHandler(theJSON);
          } else {
            let result = await tResult.text();
            fetchErrorHandler(tResult.statusText, result);
          }
        } catch (msg: any) {
          // If fetch throws an error, this is likely a network error with no
          // additional information in the message. The error, on Chrome, is of the
          // form "TypeError: Failed to fetch", but varies with browser. We
          // substitute a more informative message.
          let error = (msg && msg.toString().startsWith("TypeError:"))
              ? "Network error: The NOAA Server is likely temporarily down"
              : "Network error";
          fetchErrorHandler(error, msg);
        }
      } else {
        setStatusMessage("End date must be on or after start date");
      }
    }
  };

  return (
    <div className="App">
      <div className="header">
        <span>Retrieve weather data from observing stations.</span>
        <InfoIcon className="info-icon" title="Get further information about this CODAP plugin" onClick={handleOpenInfo}/>
      </div>
      <div className="header-divider" />
      <LocationPicker />
      <div className="divider" />
      <DateRange />
      <div className="divider" />
      <AttributesSelector />
      {state.frequencies[state.selectedFrequency].attrs.length > 0 && <AttributeFilter />}
      <div className="divider" />
      <div className="footer">
        {statusMessage && <div>{statusMessage}</div>}
        <button className="clear-data-button">Clear Data</button>
        <button className="get-data-button" disabled={isFetching} onClick={handleGetData}>Get Data</button>
      </div>
      {showModal === "info" && <InfoModal />}
      {showModal === "data-return-warning" && <DataReturnWarning />}
    </div>
  );
};
