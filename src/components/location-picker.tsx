import React, { useEffect, useRef, useState } from "react";
import classnames from "classnames";
import { autoComplete, geoLocSearch } from "../utils/geonameSearch";
import { useStateContext } from "../hooks/use-state";
import { IPlace, IStation } from "../types";
import { findNearestActiveStations } from "../utils/getWeatherStations";
import OpenMapIcon from "../assets/images/icon-map.svg";
import EditIcon from "../assets/images/icon-edit.svg";
import LocationIcon from "../assets/images/icon-location.svg";
import CurrentLocationIcon from "../assets/images/icon-current-location.svg";

import "./location-picker.scss";

export const LocationPicker = () => {
  const {state, setState} = useStateContext();
  const [showMapButton, setShowMapButton] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locationPossibilities, setLocationPossibilities] = useState<IPlace[]>([]);
  const [showSelectionList, setShowSelectionList] = useState(false);
  const [stationPossibilities, setStationPossibilities] = useState<IStation[]>([]);
  const [showStationSelectionList, setShowStationSelectionList] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [arrowedIndex, setArrowedIndex] = useState<number>(-1);
  const locationDivRef = useRef<HTMLDivElement>(null);
  const locationInputEl = useRef<HTMLInputElement>(null);
  const locationSelectionListEl = useRef<HTMLUListElement>(null);
  const stationSelectionListEl = useRef<HTMLUListElement>(null);
  const selectedLocation = state.location;
  const unit = state.units;
  const unitDistanceText = unit === "standard" ? "mi" : "km";
  const selectedStation = state.weatherStation;
  const selectedStationDistance = state.weatherStationDistance;
  const stationDistance = selectedStationDistance && unit === "standard"
                            ? Math.round((selectedStationDistance * 0.6 * 10) / 10)
                            :selectedStationDistance &&  Math.round(selectedStationDistance * 10) / 10;

  const handleOpenMap = () => {
    //send request to CODAP to open map with available weather stations
  };

  useEffect(() => {
    if (locationInputEl.current?.value === "") {
      setShowSelectionList(false);
      // setSelectedLocation(undefined);
    }
  }, [locationInputEl.current?.value]);

  useEffect(() => {
    if (isEditing) {
      locationInputEl.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
      if (selectedLocation) {
        findNearestActiveStations(selectedLocation.latitude, selectedLocation.longitude, 80926000, "present")
          .then((stationList: IStation[]) => {
            if (stationList) {
              setStationPossibilities(stationList);
              (isEditing && stationList.length > 0) && setShowSelectionList(true);
              setState((draft) => {
                draft.weatherStation = stationList[0].station;
                draft.weatherStationDistance = stationList[0].distance;
              });
            }
        });
            // if (station) {
            //   setState((draft) => {
            //     draft.weatherStation = station;
            //     draft.weatherStationDistance = distance;
            //   });
            // }
          // });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedLocation]);

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
    });
    setShowSelectionList(false);
    setIsEditing(false);
    setShowMapButton(true);
    setLocationPossibilities([]);
    setHoveredIndex(null);
    setArrowedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && locationPossibilities.length > 0) {
      setHoveredIndex(0);
      setArrowedIndex(0);
      locationSelectionListEl.current?.focus();
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const listItems = locationSelectionListEl.current?.children;
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

  const handleLocationInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    if (target.value !== "") {
      getLocationList();
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
        });
      }
    }
  };

  const handlePlaceNameSelectionKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.key === "Enter") {
      placeNameSelected(locationPossibilities[index-1]);

    }
  };

  const handleFindCurrentLocation = async() => {
    navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const long = position.coords.longitude;
      geoLocSearch(lat, long).then((currPosName) => {
        setState(draft => {
          draft.location = {name: currPosName, latitude: lat, longitude: long};
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

  return (
    <div className="location-picker-container">
      <div className="location-header">
        <span className="location-title">Location</span>
        { selectedLocation && !isEditing &&
          <div className="weather-station-wrapper">
            <div className="selected-weather-station" onClick={()=>setShowStationSelectionList(true)}>
              { state.weatherStation &&
                <>
                  <span className="station-distance">({stationDistance} {unitDistanceText}) </span>
                  <span className="station-name">{selectedStation?.name}</span>
                  <EditIcon />
                </>
              }
            </div>
            <div className={classnames("station-selection-list", {"show": showStationSelectionList})}>
            <ul ref={stationSelectionListEl}>
              {stationPossibilities.map((station: IStation, idx: number) => {
                if (station) {
                  return (
                    <li key={`${station}-${idx}`} value={station.station.name}
                            className={classnames("station-selection", {"selected-station": station.station.name === state.weatherStation?.name})}>
                      <span className="station-distance">{station.distance} from {state.location?.name}</span>
                      <span className="station-name"> {station.station.name}</span>
                    </li>
                  );
                }
              })}
            </ul>
            </div>
          </div>
        }
      </div>
      <div className="location-input-container">
        <div className="location-input-selection" onKeyDown={handleListKeyDown}>
          <div ref={locationDivRef} className={classnames("location-input-wrapper", {"short" : showMapButton, "editing": isEditing})}
                onClick={handleLocationInputClick}>
            <LocationIcon />
            { selectedLocation && !isEditing
                ? <div>
                    <span className="selected-loc-intro">Stations near </span>
                    <span className="selected-loc-name">{state.location?.name}</span>
                  </div>
                : <input ref={locationInputEl} className="location-input" type="text" placeholder={"Enter location or identifier here"}
                    onChange={handleLocationInputChange} onKeyDown={handleInputKeyDown} onBlur={handleLocationInputBlur}/>
            }
          </div>
          { isEditing &&
            <ul
              ref={locationSelectionListEl}
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
