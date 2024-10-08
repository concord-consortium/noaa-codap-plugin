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
import { addNotificationHandler, createStationsDataset, guaranteeGlobal, hasMap } from "../utils/codapHelpers";
import { useCODAPApi } from "../hooks/use-codap-api";
import { composeURL, formatData } from "../utils/noaaApiHelper";
import { DSName, StationDSName, globalMaxDate, globalMinDate } from "../constants";
import { geoLocSearch, geoNameSearch } from "../utils/geonameSearch";
import { DataReturnWarning } from "./data-return-warning";
import { IState, IStation, IStatus, ILegacyState } from "../types";
import InfoIcon from "../assets/images/icon-info.svg";
import ProgressIcon from "../assets/images/icon-progress-indicator.svg";
import DoneIcon from "../assets/images/icon-done.svg";
import WarningIcon from "../assets/images/icon-warning.svg";

import "./App.scss";

const kPluginName = "NOAA Weather Station Data";
const kVersion = "v0.1.4";
const kInitialDimensions = {
  width: 360,
  height: 670
};

export const App = () => {
  const { state, setState } = useStateContext();
  const { showModal, location, weatherStation, startDate, endDate, timezone, units, frequencies, selectedFrequency } = state;
  const { filterItems, clearData, createNOAAItems } = useCODAPApi();
  const [isFetching, setIsFetching] = useState(false);
  const [disableGetData, setDisableGetData] = useState(true);
  const [activeStations, setActiveStations] = useState<IStation[]>([]);
  const [status, setStatus] = useState<IStatus>();
  const weatherStations = getWeatherStations();

  useEffect(() => {
    const init = async () => {
      const newState = await initializePlugin({pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions});
      const isMapOpen = await hasMap();
      // plugins in new documents return an empty object for the interactive state
      // so ignore the new state and keep the default starting state in that case
      // Check if newState is essentially empty
      if (Object.keys(newState || {}).length === 0) {
        // eslint-disable-next-line no-console
        console.log("New state is empty, keeping default state.");
        return;
      }
      // legacy plugin uses sampleFrequency as key vs new plugin uses selectedFrequency
      const isLegacy = "sampleFrequency" in newState;
      let locale = "", localeLat=0, localeLong=0, distance=0;
      if (isLegacy) {
        const legacyState = newState as ILegacyState;
        const legacyStation = legacyState.selectedStation;
        const locationInfo = await geoLocSearch(legacyStation.latitude, legacyStation.longitude);
        locale = `${locationInfo.split(",")[0]}, ${locationInfo.split(",")[1]}`;
        distance = Number(locationInfo.split(",")[2]);
        const localeLatLong = await geoNameSearch(locale);
        localeLat = localeLatLong?.[0].latitude || legacyStation.latitude;
        localeLong = localeLatLong?.[0].longitude || legacyStation.longitude;
      }
      setState((draft: IState) => {
        if (isLegacy) {
          draft.isMapOpen = isMapOpen;
          const legacyState = newState as ILegacyState;
          draft.selectedFrequency = legacyState.sampleFrequency;
          draft.units = legacyState.unitSystem;
          draft.didUserSelectDate = !!legacyState.userSelectedDate;
          draft.weatherStation = legacyState.selectedStation;
          draft.weatherStationDistance = distance;
          draft.location = {name: locale, latitude: localeLat, longitude: localeLong};
          const startDateStr = legacyState.startDate;
          const endDateStr = legacyState.endDate;
          if (draft.timezone) {
            draft.timezone.gmtOffset = (legacyState.stationTimezoneOffset).toString();
            draft.timezone.name = legacyState.stationTimezoneName;
          }
          if (startDateStr) {
            draft.startDate = dayjs(startDateStr).toDate();
          }
          if (endDateStr) {
            draft.endDate = dayjs(endDateStr).toDate();
          }
        } else {
          const _newState = newState as IState;
          draft.location = _newState.location;
          draft.selectedFrequency = _newState.selectedFrequency;
          draft.units = _newState.units;
          draft.timezone = _newState.timezone;
          draft.weatherStation = _newState.weatherStation;
          draft.weatherStationDistance = _newState.weatherStationDistance;
          draft.zoomMap = _newState.zoomMap;
          draft.frequencies =_newState.frequencies;
          draft.didUserSelectDate = _newState.didUserSelectDate;
          draft.isMapOpen = _newState.isMapOpen;
          const startDateStr = _newState.startDate;
          const endDateStr = _newState.endDate;
          if (startDateStr) {
            draft.startDate = dayjs(startDateStr).toDate();
          }
          if (endDateStr) {
            draft.endDate = dayjs(endDateStr).toDate();
          }
        }
      });
    };
    init();
    const adjustedStationDataset = adjustStationDataset(); //change max data to "present"
    createStationsDataset(adjustedStationDataset); //send weather station data to CODAP

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
    if (activeStations.find(as => as.station.name === weatherStation?.name)) {
      setStatus({
        status: "success",
        message: "Station is active for date range",
        icon: <DoneIcon />
      });
    } else if (weatherStation) {
      setDisableGetData(true);
      setStatus({
        status: "station-error",
        message: "Station was inactive for date range",
        icon: <WarningIcon />
      });
    }
  }, [activeStations, weatherStation]);

  useEffect(() => {
    const allDefined = (startDate && endDate && location && weatherStation && status?.status !== "station-error");
    setDisableGetData(!allDefined);
  }, [location, endDate, startDate, weatherStation, timezone, units, status?.status]);

  useEffect(() => {
    const minDate = startDate || new Date( -5364662060);
    const maxDate = endDate || new Date(Date.now());
    guaranteeGlobal(globalMinDate, Number(minDate)/1000);
    guaranteeGlobal(globalMaxDate, Number(maxDate)/1000);
    if (weatherStation && (!startDate || !endDate)) {
      setStatus({
        status: "error",
        message: "Select a date range",
        icon: <WarningIcon/>
      });
    }
    // if the start date of the weather station is after the user's requested end date, then the station is inactive
    const stationMinDate = new Date(weatherStation?.mindate || globalMinDate);
    const stationNotActiveYet = stationMinDate > maxDate;
    if (stationNotActiveYet) {
      setStatus({
        status: "station-error",
        message: "Station was inactive for date range",
        icon: <WarningIcon/>
      });
    }
  }, [endDate, startDate, weatherStations, weatherStation]);

  const stationSelectionHandler = async(req: any) =>{
    if (req.values.operation === "selectCases") {
      const result = req.values.result;
      const myCase = result && (result.cases.length === 1) && result.cases[0];
      if (myCase) {
        const station = myCase.values;
        const {latitude, longitude} = station;
        const locationInfo = await geoLocSearch(latitude, longitude);
        const locale = `${locationInfo.split(",")[0]}, ${locationInfo.split(",")[1]}`;
        const distance = Number(locationInfo.split(",")[2]);
        const localeLatLong = await geoNameSearch(locale);
        const localeLat = localeLatLong?.[0].latitude || longitude;
        const localeLong = localeLatLong?.[0].longitude || longitude;

        setState((draft) => {
          draft.weatherStation = station;
          draft.location = {name: locale, latitude: localeLat, longitude: localeLong};
          draft.weatherStationDistance = distance;
          draft.zoomMap = false;
          draft.didUserSelectStationFromMap = true;
        });
      }
    }
  };

  const handleOpenInfo = () => {
    setState(draft => {
      draft.showModal = "info";
    });
  };

  const fetchSuccessHandler = async (data: any) => {
    const allDefined = (startDate && endDate && units && selectedFrequency &&
      weatherStation && timezone);

    if (data.length && allDefined) {
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
        message: "No data retrieved. Change frequency or station.",
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
      <div className="header" title="About this plugin">
        <span>Retrieve weather data from observing stations.</span>
        <span title="Get further information about this CODAP plugin">
          <InfoIcon className="info-icon" onClick={handleOpenInfo}/>
        </span>
      </div>
      <div className="header-divider" />
      <LocationPicker setActiveStations={setActiveStations} setStatus={setStatus}/>
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
          <button className="clear-data-button" disabled={isFetching || disableGetData} onClick={handleClearData}
            title="Clear weather data in CODAP.">
              Clear Data
          </button>
          <button className="get-data-button" disabled={isFetching || disableGetData} onClick={handleGetData}
            title="Fetch weather data from NOAA and send to CODAP">
              Get Data
          </button>
        </div>
      </div>
      {showModal === "info" && <InfoModal />}
      {showModal === "data-return-warning" && <DataReturnWarning />}
    </div>
  );
};
