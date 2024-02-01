import React, { useEffect, useRef, useState } from "react";
import classnames from "classnames";
import { autoComplete, geoLocSearch } from "../utils/geonameSearch";
import { geonamesUser, kOffsetMap, timezoneServiceURL } from "../constants";
import { useStateContext } from "../hooks/use-state";
import { IPlace, IStation } from "../types";
import { convertDistanceToStandard, findNearestActiveStations } from "../utils/getWeatherStations";
import OpenMapIcon from "../assets/images/icon-map.svg";
import EditIcon from "../assets/images/icon-edit.svg";
import LocationIcon from "../assets/images/icon-location.svg";
import CurrentLocationIcon from "../assets/images/icon-current-location.svg";

import "./location-picker.scss";

export const LocationPicker = () => {
  const {state, setState} = useStateContext();
  const {units, location, weatherStation, weatherStationDistance, startDate, endDate, didUserSelectStationFromMap} = state;
  const [showMapButton, setShowMapButton] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locationPossibilities, setLocationPossibilities] = useState<IPlace[]>([]);
  const [showSelectionList, setShowSelectionList] = useState(false);
  const [stationPossibilities, setStationPossibilities] = useState<IStation[]>([]);
  const [showStationSelectionList, setShowStationSelectionList] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredStationIndex, setStationHoveredIndex] = useState<number | null>(null);
  const [arrowedIndex, setArrowedIndex] = useState<number>(-1);
  const [distanceWidth, setDistanceWidth] = useState<number>(0);
  const locationDivRef = useRef<HTMLDivElement>(null);
  const locationInputEl = useRef<HTMLInputElement>(null);
  const locationSelectionListElRef = useRef<HTMLUListElement>(null);
  const stationSelectionListElRef = useRef<HTMLUListElement>(null);
  const firstStationListedRef = useRef<HTMLSpanElement>(null);
  const unitDistanceText = units === "standard" ? "mi" : "km";
  const stationDistance =
          weatherStationDistance === undefined
            ? 0 : units === "standard" ? convertDistanceToStandard(weatherStationDistance)
                                        : weatherStationDistance;
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (event.target) {
        if (stationSelectionListElRef.current && !stationSelectionListElRef.current.contains(event.target as Node)) {
          setShowStationSelectionList(false);
        }
        if (locationSelectionListElRef.current && !locationSelectionListElRef.current.contains(event.target as Node)) {
          setShowSelectionList(false);
          setIsEditing(false);
        }
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (locationInputEl.current?.value === "") {
      setShowSelectionList(false);
    }
  }, [locationInputEl.current?.value]);

  useEffect(() => {
    if (isEditing) {
      locationInputEl.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (location) {
      setShowMapButton(true);
    }
  }, [location]);

  useEffect(() => {
    const _startDate = startDate ? startDate : new Date( -5364662060); // 1/1/1750
    const _endDate = endDate ? endDate : new Date(Date.now());
    if (location && !didUserSelectStationFromMap) {
      findNearestActiveStations(location.latitude, location.longitude, _startDate, _endDate)
        .then((stationList: IStation[]) => {
          if (stationList) {
            setStationPossibilities(stationList);
            (isEditing && stationList.length > 0) && setShowSelectionList(true);
          }
          setState((draft) => {
            draft.weatherStation = stationList[0].station;
            draft.weatherStationDistance = stationList[0].distance;
          });
      });
      const fetchTimezone = async (lat: number, long: number) => {
        let url = `${timezoneServiceURL}?lat=${lat}&lng=${long}&username=${geonamesUser}`;
        let res = await fetch(url);
        if (res) {
          if (res.ok) {
            const timezoneData = await res.json();
            const { gmtOffset } = timezoneData as { gmtOffset: keyof typeof kOffsetMap };
            setState((draft) => {
              draft.timezone = {
                gmtOffset,
                name: kOffsetMap[gmtOffset]
              };
            });
          } else {
            console.warn(res.statusText);
          }
        } else {
          console.warn(`Failed to fetch timezone data for ${location}`);
        }
      };
      fetchTimezone(location.latitude, location.longitude);
    } else {
      setState((draft) => {
        draft.timezone = undefined;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[endDate, isEditing, location, startDate, didUserSelectStationFromMap]);

  useEffect(() => {
    if (showStationSelectionList) {
      const listItems = stationSelectionListElRef.current?.children;
      if (listItems && firstStationListedRef.current) {
        const firstStationWidth = firstStationListedRef.current?.getBoundingClientRect().width;
        setDistanceWidth(firstStationWidth ? firstStationWidth : 120);
      }
    }
  },[showStationSelectionList]);

  const getLocationList = () => {
    if (locationInputEl.current) {
      autoComplete(locationInputEl.current)
        .then ((placeList: IPlace[] | undefined) => {
                  if (placeList) {
                    setLocationPossibilities(placeList);
                    (isEditing && placeList.length > 0) && setShowSelectionList(true);
                  }
              });
    }
  };

  const placeNameSelected = (place: IPlace | undefined) => {
    setState(draft => {
      draft.location = place;
      draft.didUserSelectStationFromMap = false;
    });
    setShowSelectionList(false);
    setIsEditing(false);
    setShowMapButton(true);
    setLocationPossibilities([]);
    setHoveredIndex(null);
    setArrowedIndex(-1);
  };

  const stationSelected = (station: IWeatherStation | undefined) => {
    setState(draft => {
      draft.weatherStation = station;
      draft.didUserSelectStationFromMap = false;
    });
    setShowStationSelectionList(false);
    setStationHoveredIndex(null);
    setArrowedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && locationPossibilities.length > 0) {
      setHoveredIndex(0);
      setArrowedIndex(0);
      locationSelectionListElRef.current?.focus();
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const listItems = locationSelectionListElRef.current?.children;
    if (e.key === "Enter") {
      placeNameSelected(locationPossibilities[arrowedIndex-1]);
    } else
    if (e.key === "ArrowUp" && listItems && arrowedIndex > 0) {
      if (arrowedIndex > 0) {
        const previousIndex = (arrowedIndex - 1 + listItems.length) % listItems.length;
        setHoveredIndex(previousIndex);
        (listItems[previousIndex] as HTMLElement).focus();
        setArrowedIndex(previousIndex);
      } else {
        locationInputEl.current?.focus();
      }

    } else if (e.key === "ArrowDown" && listItems && arrowedIndex < listItems.length) {
      if ((arrowedIndex < 0) && listItems) {
        setHoveredIndex(0);
        (listItems[0] as HTMLElement).focus();
        setArrowedIndex(0);
      } else {
        const nextIndex = (arrowedIndex + 1) % listItems.length;
        setHoveredIndex(nextIndex);
        (listItems[nextIndex] as HTMLElement).focus();
        setArrowedIndex(nextIndex);
      }
    }
  };

  const handleLocationHover = (index: number | null) => {
    setHoveredIndex(index);
  };

  const handleStationHover = (index: number | null) => {
    setStationHoveredIndex(index);
  };

  const handleLocationInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    if (target.value !== "") {
      getLocationList();
    } else {
      setIsEditing(false);
    }
  };

  const handlePlaceNameSelection = (ev: React.MouseEvent<HTMLLIElement>) => {
    const target = ev.currentTarget;
    if (target.dataset.ix !== undefined) {
      const selectedLocIdx = parseInt(target.dataset.ix, 10);
      if (selectedLocIdx >= 0) {
        placeNameSelected(locationPossibilities[selectedLocIdx]);
        setState(draft=>{
          draft.location = locationPossibilities[selectedLocIdx];
          draft.didUserSelectStationFromMap = false;
          if (state.isMapOpen) {
            draft.zoomMap = true;
          }
        });
      }
    }
  };

  const handlePlaceNameSelectionKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.key === "Enter") {
      placeNameSelected(locationPossibilities[index-1]);
      setState(draft => {
        draft.zoomMap = true;
      });
    }
  };

  const handleStationSelection = (ev: React.MouseEvent<HTMLLIElement>) => {
    const target = ev.currentTarget;
    if (target.dataset.ix !== undefined) {
      const selectedLocIdx = parseInt(target.dataset.ix, 10);
      if (selectedLocIdx >= 0) {
        const selectedStation = stationPossibilities[selectedLocIdx].station;
        stationSelected(selectedStation);
        setState(draft => {
          draft.didUserSelectStationFromMap = false;
          draft.weatherStation = selectedStation;
          draft.weatherStationDistance = stationPossibilities[selectedLocIdx].distance;
        });
      }
      setShowStationSelectionList(false);
      setState(draft => {
        draft.zoomMap = false;
      });
    }
  };

  const handleStationSelectionKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.key === "Enter") {
      const selectedStation = stationPossibilities[index].station;
      stationSelected(selectedStation);
      setState(draft => {
        draft.weatherStation = selectedStation;
        draft.weatherStationDistance = stationPossibilities[index].distance;
      });
      setShowStationSelectionList(false);
      setState(draft => {
        draft.zoomMap = false;
      });
    }
  };

  const handleFindCurrentLocation = async() => {
    navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const long = position.coords.longitude;
      geoLocSearch(lat, long).then((currPosName) => {
        setState(draft => {
          draft.location = {name: currPosName, latitude: lat, longitude: long};
          draft.didUserSelectStationFromMap = false;
        });
        setShowMapButton(true);
        setIsEditing(false);
        setShowSelectionList(false);
      });
    });
  };

  const handleLocationInputChange = () => {
    getLocationList();
  };

  const handleLocationInputClick = () => {
    setIsEditing(true);
  };

  const handleOpenMap = () => {
    if (weatherStation) {
      setState((draft) => {
        draft.isMapOpen = true;
        draft.zoomMap = true;
      });
    }
  };

  return (
    <div className="location-picker-container">
      <div className="location-header">
        <span className="location-title">Location</span>
        { location && !isEditing &&
          <div className="weather-station-wrapper">
            <div className="selected-weather-station" onClick={()=>setShowStationSelectionList(true)}>
              { weatherStation &&
                <>
                  <span className="station-distance">({stationDistance?.toFixed(1)} {unitDistanceText}) </span>
                  <span className="station-name"> {weatherStation?.name}</span>
                  <EditIcon />
                </>
              }
            </div>
            <ul ref={stationSelectionListElRef} className={classnames("station-selection-list", {"show": showStationSelectionList})}>
              {stationPossibilities.map((station: IStation, idx: number) => {
                if (station) {
                  const stationDistanceText = units === "standard" ? convertDistanceToStandard(station.distance) : station.distance;
                  return (
                    <li key={`${station}-${idx}`} data-ix={`${idx}`} value={station.station.ICAO}
                        className={classnames("station-selection", {"station-candidate": hoveredStationIndex === idx},
                                    {"selected-station": (station.station.name === state.weatherStation?.name && hoveredStationIndex === null)})}
                        onMouseOver={()=>handleStationHover(idx)} onClick={(e)=>handleStationSelection(e)} onKeyDown={(e)=>handleStationSelectionKeyDown(e,idx)}>
                      <span className="station-distance" ref={idx === 0 ? firstStationListedRef : null} style={{width: distanceWidth}}>
                        {stationDistanceText.toFixed(1)} {unitDistanceText} {idx === 0 && `from ${state.location?.name}`}
                      </span>
                      <span className="station-name"> {station.station.name}</span>
                    </li>
                  );
                }
              })}
            </ul>
          </div>
        }
      </div>
      <div className="location-input-container">
        <div className="location-input-selection" onKeyDown={handleListKeyDown}>
          <div ref={locationDivRef} className={classnames("location-input-wrapper", {"short" : showMapButton, "editing": isEditing})}
                onClick={handleLocationInputClick}>
            <LocationIcon />
            { location && !isEditing
                ? <div>
                    <span className="selected-loc-intro">Stations near </span>
                    <span className="selected-loc-name">{location?.name}</span>
                  </div>
                : <input ref={locationInputEl} className="location-input" type="text" placeholder={"Enter location or identifier here"}
                    onChange={handleLocationInputChange} onKeyDown={handleInputKeyDown} onBlur={handleLocationInputBlur}/>
            }
          </div>
          {(isEditing && locationInputEl.current?.value !=="") &&
            <ul
              ref={locationSelectionListElRef}
              className={classnames("location-selection-list", {"show": showSelectionList, "short" : showMapButton})}
              onFocus={() => setHoveredIndex(null)}>
              <li className={classnames("current-location-wrapper", {"geoname-candidate": hoveredIndex === -1})}
                  tabIndex={1} onClick={handleFindCurrentLocation} onMouseOver={() => handleLocationHover(null)}
                  onKeyDown={(e)=>handlePlaceNameSelectionKeyDown(e, 0)}>
                <CurrentLocationIcon className="current-location-icon"/>
                <span className="current-location">Use current location</span>
              </li>
              {locationPossibilities.length > 0 &&
                  locationPossibilities.map((loc, idx) => {
                    return (
                      <li  key={`${loc}-${idx}`} data-ix={`${idx}`} tabIndex={1}
                            className={classnames("location-selector-option", {"geoname-candidate": hoveredIndex === idx})}
                            onMouseOver={()=>handleLocationHover(idx)} onClick={(e)=>handlePlaceNameSelection(e)} onKeyDown={(e)=>handlePlaceNameSelectionKeyDown(e,idx)}>
                        <span className="location-name">{loc.name}</span>
                      </li>
                    );
                  })
                }
            </ul>
          }
        </div>
        { showMapButton &&
          <button className="map-button" onClick={handleOpenMap}>
            <OpenMapIcon />
          </button>
        }
      </div>
    </div>
  );
};
