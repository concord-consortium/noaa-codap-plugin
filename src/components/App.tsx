import React, { useEffect } from "react";
import { initializePlugin } from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range/date-range";
import { AttributesSelector } from "./attribute-selector";
import { AttributeFilter } from "./attribute-filter";
import { InfoModal } from "./info-modal";
import { useStateContext } from "../hooks/use-state";
import { adjustStationDataset } from "../utils/getWeatherStations";
import { createStationsDataset } from "../utils/codapHelpers";
import weatherStations from "../assets/data/weather-stations.json";
import InfoIcon from "../assets/images/icon-info.svg";
import { useNOAAApi } from "../hooks/use-noaa-api";
import { useCODAPApi } from "../hooks/use-codap-api";

import "./App.scss";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 495
};

export const App = () => {
  const { state, setState } = useStateContext();
  const { composeURL, formatData } = useNOAAApi();
  const { createNOAAItems } = useCODAPApi();
  const [statusMessage, setStatusMessage] = React.useState("");
  const [isFetching, setIsFetching] = React.useState(false);
  const { showModal } = state;

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

  const getSelectedDataTypes = () => {
    return [];
  };

  const fetchSuccessHandler = (data: any) => {
    console.log("data") // to-do: inspect data and make an interface
    if (data) {
      const dataRecords = formatData(data);
      setStatusMessage('Sending weather records to CODAP');
      createNOAAItems(dataRecords, getSelectedDataTypes()).then(
        function (result: any) {
          setIsFetching(false);
          setStatusMessage(`Retrieved ${dataRecords.length} cases`);
          return result;
        },
        function (msg: string) {
          setIsFetching(false);
          setStatusMessage(msg);
        }
      );
    } else {
      setIsFetching(false);
      setStatusMessage('No data retrieved');
    }
  };

  const fetchErrorHandler = (message: string, resultText: string) => {
    if (resultText && resultText.length && (resultText[0] === '<')) {
      try {
        let xmlDoc = new DOMParser().parseFromString(resultText, 'text/xml');
        message = xmlDoc.getElementsByTagName('userMessage')[0].innerHTML;
        message += '(' + xmlDoc.getElementsByTagName(
            'developerMessage')[0].innerHTML + ')';
      } catch (e) {
      }
    }
    console.warn('fetchErrorHandler: ' + resultText);
    console.warn("fetchErrorHandler error: " + message);
    setIsFetching(false);
    setStatusMessage(message);
  };


  const handleGetData = () => {
    const { location, startDate, endDate, weatherStation, attributes } = state;
    if (location && attributes && startDate && endDate && weatherStation) {
    const isEndDateAfterStartDate = endDate.getTime() >= startDate.getTime();
    if (isEndDateAfterStartDate) {
      setStatusMessage("Fetching weather records from NOAA");
      const tURL = composeURL();
      try {
        const tRequest = new Request(tURL);
        const tResult = await fetch(tRequest, {mode: 'cors'});
        setIsFetching(true);
        if (tResult.ok) {
          const theJSON = await tResult.json();
          fetchSuccessHandler(theJSON);
        } else {
          let result = await tResult.text();
          fetchErrorHandler(tResult.statusText, result);
        }
      } catch (msg: string) {
        // If fetch throws an error, this is likely a network error with no
        // additional information in the message. The error, on Chrome, is of the
        // form "TypeError: Failed to fetch", but varies with browser. We
        // substitute a more informative message.
        let error = (msg && msg.toString().startsWith('TypeError:'))
            ? 'Network error: The NOAA Server is likely temporarily down'
            : 'Network error'
        fetchErrorHandler(error, msg);
      }
    } else {
      setStatusMessage("End date must be on or after start date");
    }
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
      {state.attributes.length > 0 && <AttributeFilter />}
      <div className="divider" />
      <div className="footer">
        {statusMessage && <div>{statusMessage}</div>}
        <button className="clear-data-button">Clear Data</button>
        <button className="get-data-button" disabled={isFetching}>Get Data</button>
      </div>
      {showModal === "info" && <InfoModal />}
    </div>
  );
};
