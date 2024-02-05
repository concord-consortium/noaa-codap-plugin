import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { ClientNotification, addComponentListener, initializePlugin } from "@concord-consortium/codap-plugin-api";
import { LocationPicker } from "./location-picker";
import { DateRange } from "./date-range/date-range";
import { AttributesSelector } from "./attribute-selector";
import { AttributeFilter } from "./attribute-filter";
import { InfoModal } from "./info-modal";
import { useStateContext } from "../hooks/use-state";
import { adjustStationDataset, getWeatherStations } from "../utils/getWeatherStations";
import { addNotificationHandler, createStationsDataset, guaranteeGlobal } from "../utils/codapHelpers";
import { useCODAPApi } from "../hooks/use-codap-api";
import { composeURL, formatData } from "../utils/noaaApiHelper";
import { DSName, StationDSName, globalMaxDate, globalMinDate } from "../constants";
import { geoLocSearch } from "../utils/geonameSearch";
import { DataReturnWarning } from "./data-return-warning";
import { IState } from "../types";
import InfoIcon from "../assets/images/icon-info.svg";
import ProgressIcon from "../assets/images/icon-progress-indicator.svg";
import DoneIcon from "../assets/images/icon-done.svg";
import WarningIcon from "../assets/images/icon-warning.svg";

import "./App.scss";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "0014";
const kInitialDimensions = {
  width: 360,
  height: 670
};

interface IStatus {
  status: "success" | "error" | "fetching";
  message: string;
  icon: JSX.Element;
}

export const App = () => {
  const { state, setState } = useStateContext();
  const { showModal, location, weatherStation, startDate, endDate, timezone, units, frequencies, selectedFrequency } = state;
  const { filterItems, clearData, createNOAAItems } = useCODAPApi();
  const [isFetching, setIsFetching] = useState(false);
  const [disableGetData, setDisableGetData] = useState(true);
  const [status, setStatus] = useState<IStatus>();
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
          const locationInfo = await geoLocSearch(latitude, longitude);
          const locale = `${locationInfo.split(",")[0]}, ${locationInfo.split(",")[1]}`;
          const distance = Number(locationInfo.split(",")[2]);
          setState((draft) => {
            draft.weatherStation = station;
            draft.location = {name: locale, latitude, longitude};
            draft.weatherStationDistance = distance;
            draft.zoomMap = false;
            draft.didUserSelectStationFromMap = true;
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
      if (values.operation === "delete" && values.type === "DG.MapView" && values.name === "US-Weather-Stations") {
        setState((draft) => {
          draft.zoomMap = false;
          draft.isMapOpen = false;
          draft.didUserSelectStationFromMap = false;
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
    const adjustedStationDataset = adjustStationDataset(); //change max data to "present"
    createStationsDataset(adjustedStationDataset); //send weather station data to CODAP
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
      setStatus({
        status: "fetching",
        message: "Sending weather records to CODAP",
        icon: <ProgressIcon className="status-icon progress"/>
      });
      await createNOAAItems(filteredItems).then(
        function (result: any) {
          setIsFetching(false);
          setStatus({
            status: "success",
            message: `Retrieved ${filteredItems.length} cases`,
            icon: <DoneIcon/>
          });
          return result;
        },
        function (msg: string) {
          setIsFetching(false);
          setStatus({
            status: "error",
            message: msg,
            icon: <WarningIcon/>
          });
        }
      );
    } else {
      setIsFetching(false);
      setStatus({
        status: "error",
        message: "No data retrieved",
        icon: <WarningIcon/>
      });
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
    setStatus({
      status: "error",
      message,
      icon: <WarningIcon/>
    });
  };

  const handleGetData = async () => {
    const allDefined = (startDate && endDate && location && weatherStation && timezone);
    if (allDefined) {
      const attributes = frequencies[selectedFrequency].attrs.map(attr => attr.name);
      const isEndDateAfterStartDate = endDate.getTime() >= startDate.getTime();
      if (isEndDateAfterStartDate) {
        setStatus({
          status: "fetching",
          message: "Fetching weather records from NOAA",
          icon: <ProgressIcon className="status-icon progress"/>
        });
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
        setStatus({
          status: "error",
          message: "End date must be on or after start date",
          icon: <WarningIcon/>
        });
      }
    }
  };

  const handleClearData = () => {
    clearData(DSName);
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
      <div className={"footer"}>
        <div className="status-update">
          <div className="status-icon">{status ? status.icon : ""}</div>
          <div className={`status-message ${status?.status}`}>{status ? status.message : ""}</div>
        </div>
        <div>
          <button className="clear-data-button" disabled={isFetching || disableGetData} onClick={handleClearData}>Clear Data</button>
          <button className="get-data-button" disabled={isFetching || disableGetData} onClick={handleGetData}>Get Data</button>
        </div>
      </div>
      {showModal === "info" && <InfoModal />}
      {showModal === "data-return-warning" && <DataReturnWarning />}
    </div>
  );
};
