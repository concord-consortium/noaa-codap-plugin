import React, { useState, useEffect } from "react";
import { ClientNotification, addComponentListener, initializePlugin } from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range/date-range";
import { AttributesSelector } from "./attribute-selector";
import { AttributeFilter } from "./attribute-filter";
import { InfoModal } from "./info-modal";
import { useStateContext } from "../hooks/use-state";
import { adjustStationDataset, getWeatherStations } from "../utils/getWeatherStations";
import { addNotificationHandler, createStationsDataset, guaranteeGlobal } from "../utils/codapHelpers";
import InfoIcon from "../assets/images/icon-info.svg";
import { useCODAPApi } from "../hooks/use-codap-api";
import { composeURL, formatData } from "../utils/noaaApiHelper";
import { StationDSName, globalMaxDate, globalMinDate } from "../constants";
import { geoLocSearch } from "../utils/geonameSearch";
import { DataReturnWarning } from "./data-return-warning";
import { IState } from "../types";
import dayjs from "dayjs";

import "./App.scss";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 670
};

export const App = () => {
  const { state, setState } = useStateContext();
  const { showModal, location, weatherStation, startDate, endDate, timezone, units, frequencies, selectedFrequency } = state;
  const { filterItems, createNOAAItems } = useCODAPApi();
  const [statusMessage, setStatusMessage] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [disableGetData, setDisableGetData] = useState(true);
  const weatherStations = getWeatherStations();

  useEffect(() => {
    const init = async () => {
      const newState = await initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions}) as IState;
      // plugins in new documents return an empty object for the interactive state
      // so ignore the new state and keep the default starting state in that case
      if (Object.keys(newState || {}).length > 0) {
        setState((draft) => {
          draft.location = newState.location;
          draft.selectedFrequency = newState.selectedFrequency;
          draft.units = newState.units;
          draft.timezone = newState.timezone;
          draft.weatherStation = newState.weatherStation;
          draft.weatherStationDistance = newState.weatherStationDistance;
          draft.zoomMap = newState.zoomMap;
          draft.frequencies = newState.frequencies;
          draft.didUserSelectDate = newState.didUserSelectDate;
          draft.isMapOpen = newState.isMapOpen;

          const startDateStr = newState.startDate;
          const endDateStr = newState.endDate;
          if (startDateStr) {
            draft.startDate = dayjs(startDateStr).toDate();
          }
          if (endDateStr) {
            draft.endDate = dayjs(endDateStr).toDate();
          }
        });
      }
    };
    init();

    const stationSelectionHandler = async(req: any) =>{
      if (req.values.operation === "selectCases") {
        const result = req.values.result;
        const myCase = result && result.cases && result.cases[0];
        if (myCase) {
          const station = myCase.values;
          const {latitude, longitude} = station;
          const locationName = await geoLocSearch(latitude, longitude);
          setState((draft) => {
            draft.weatherStation = station;
            draft.location = {name: locationName, latitude, longitude};
            draft.weatherStationDistance = 0;
            draft.zoomMap = false;
          });
        }
      }
    };
    addNotificationHandler("notify",
      `dataContextChangeNotice[${StationDSName}]`, async (req: any) => {
        stationSelectionHandler(req);
    });

    const createMapListener = (listenerRes: ClientNotification) => {
      const { values } = listenerRes;
      if (values.operation === "delete" && values.type === "DG.MapView" && values.name === "US Weather Stations") {
        setState((draft) => {
          draft.zoomMap = false;
          draft.isMapOpen = false;
        });
      }
    };
    addComponentListener(createMapListener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const allDefined = (startDate && endDate && location && weatherStation);
    setDisableGetData(!allDefined);
  }, [location, endDate, startDate, weatherStation, timezone, units]);

  useEffect(() => {
    const minDate = startDate || new Date( -5364662060);
    const maxDate = endDate || new Date(Date.now());
    adjustStationDataset(weatherStations); //change max data to "present"
    createStationsDataset(weatherStations); //send weather station data to CODAP
    guaranteeGlobal(globalMinDate, Number(minDate)/1000);
    guaranteeGlobal(globalMaxDate, Number(maxDate)/1000);
  }, [endDate, startDate, weatherStations]);

  const handleOpenInfo = () => {
    setState(draft => {
      draft.showModal = "info";
    });
  };

  const fetchSuccessHandler = async (data: any) => {
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
      await createNOAAItems(filteredItems).then(
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
    const allDefined = (startDate && endDate && location && weatherStation && timezone);
    if (allDefined) {
      const attributes = frequencies[selectedFrequency].attrs.map(attr => attr.name);
      const isEndDateAfterStartDate = endDate.getTime() >= startDate.getTime();
      if (isEndDateAfterStartDate) {
        setStatusMessage("Fetching weather records from NOAA");
        const tURL = composeURL({
          startDate,
          endDate,
          frequency: selectedFrequency,
          weatherStation,
          attributes,
          gmtOffset: timezone.gmtOffset,
          units
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
      {frequencies[selectedFrequency].attrs.length > 0 && <AttributeFilter />}
      <div className="divider" />
      <div className="footer">
        {statusMessage && <div>{statusMessage}</div>}
        <button className="clear-data-button">Clear Data</button>
        <button className="get-data-button" disabled={isFetching || disableGetData} onClick={handleGetData}>Get Data</button>
      </div>
      {showModal === "info" && <InfoModal />}
      {showModal === "data-return-warning" && <DataReturnWarning />}
    </div>
  );
};
