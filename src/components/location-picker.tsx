import React, { useEffect, useRef, useState } from "react";
import classnames from "classnames";
import { IPlace, autoComplete, geoLocSearch } from "../utils/geonameSearch";
import OpenMapIcon from "../assets/images/icon-map.svg";
import EditIcon from "../assets/images/icon-edit.svg";
import LocationIcon from "../assets/images/icon-location.svg";
import CurrentLocationIcon from "../assets/images/icon-current-location.svg";

import "./location-picker.scss";

const kDefaultMaxRows = 4;
const kPlaceholderText = "Enter location or identifier here";

const kClassSelectOption = "location-selector-option";
const kClassHidden = "geoname-hidden";
const kClassCandidate = "geoname-candidate";

export const LocationPicker = () => {
  const [showMapButton, setShowMapButton] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<IPlace | undefined>(undefined);
  const [locationPossibilities, setLocationPossibilities] = useState<IPlace[]>([]);
  const [showSelectionList, setShowSelectionList] = useState(false);
  const locationDivRef = useRef<HTMLDivElement>(null);
  const locationInputEl = useRef<HTMLInputElement>(null);
  const locationSelectionListEl = useRef<HTMLUListElement>(null);

  // const {state, setState} = useStateContext();

  const handleOpenMap = () => {
    //send request to CODAP to open map with available weather stations
  };

  useEffect(() => {
    if (locationInputEl.current?.value === "") {
      setShowSelectionList(false);
      setSelectedLocation(undefined);
    }
  }, [locationInputEl.current?.value]);

  useEffect(() => {
    if (isEditing) {
      locationInputEl.current?.focus();
    }
  }, [isEditing]);

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

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === "Enter") {
      getLocationList();
      ev.stopPropagation();
    } else if (ev.key === "ArrowDown") {
      if (!showSelectionList) {
        let currentCandidateEl = locationSelectionListEl.current?.querySelector("." + kClassCandidate );
        let currentIx = currentCandidateEl && currentCandidateEl.getAttribute("data-ix");
        let nextIx = (currentIx != null) && Math.min(Number(currentIx) + 1, kDefaultMaxRows);
        if (nextIx && Number(currentIx) !== nextIx) {
          let optionEls = locationSelectionListEl.current?.querySelectorAll(`.${kClassSelectOption}`);
          let nextEl = optionEls && optionEls[nextIx];
          if ((nextEl != null)
              && (nextEl !== currentCandidateEl)
              && !nextEl.classList.contains(kClassHidden)) {
            currentCandidateEl && currentCandidateEl.classList.remove(kClassCandidate);
            nextEl.classList.add(kClassCandidate);
            ev.stopPropagation();
            ev.preventDefault();
          }
        }
      }
    } else if (ev.key === "ArrowUp") {
      if (!showSelectionList) {
        let currentCandidateEl = locationSelectionListEl.current?.querySelector("." + kClassCandidate );
        let currentIx = currentCandidateEl && currentCandidateEl.getAttribute("data-ix");
        let nextIx = (currentIx != null) && Math.max(Number(currentIx) - 1, 0);
        if ((nextIx != null) && Number(currentIx) !== nextIx) {
          let optionEls = locationSelectionListEl.current?.querySelectorAll(`.${kClassSelectOption}`);
          let nextEl = optionEls && optionEls[0];
          // let nextEl = optionEls && optionEls[nextIx];
          if ((nextEl != null)
              && (nextEl !== currentCandidateEl)
              && !nextEl.classList.contains(kClassHidden)) {
            currentCandidateEl && currentCandidateEl.classList.remove(kClassCandidate);
            nextEl.classList.add(kClassCandidate);
            ev.stopPropagation();
            ev.preventDefault();
          }
        }
      }
    }
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
        setSelectedLocation(locationPossibilities[selectedLocIdx]);
        setShowSelectionList(false);
        setIsEditing(false);
        setShowMapButton(true);
        setLocationPossibilities([]);
      }
    }
  };

  const handleFindCurrentLocation = async() => {
    navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const long = position.coords.longitude;
      geoLocSearch(lat, long).then((currPosName) => {
        setSelectedLocation({name: currPosName, lat, long});
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
    setSelectedStation("station");
    setIsEditing(true);
  };

  return (
    <div className="location-picker-container">
      <div className="location-header">
        <span>Location</span>
        { selectedLocation && !isEditing &&
          <div className="selected-weather-station">
            <span>{selectedStation}</span>
            <EditIcon />
          </div>
        }
      </div>
      <div className="location-input-container">
        <div className="location-input-selection">
          <div ref={locationDivRef} className={classnames("location-input-wrapper", {"short" : showMapButton, "editing": isEditing})}
                onClick={handleLocationInputClick}>
            <LocationIcon />
            { selectedLocation && !isEditing
                ? <div>
                    <span className="selected-loc-intro">Stations near </span>
                    <span className="selected-loc-name">{selectedLocation?.name}</span>
                  </div>
                : <input ref={locationInputEl} className="location-input" type="text" placeholder={kPlaceholderText}
                    onChange={handleLocationInputChange} onKeyDown={handleKeyDown} onBlur={handleLocationInputBlur}/>
            }
          </div>
          { isEditing &&
            <ul
              ref={locationSelectionListEl}
              className={classnames("location-selection-list", {"short" : showMapButton, "show": showSelectionList})}
              tabIndex={0}
            >
              <li className="current-location-wrapper" onClick={handleFindCurrentLocation}>
                <CurrentLocationIcon className="current-location-icon"/>
                <span className="current-location">Use current location</span>
              </li>
              {locationPossibilities.length > 0 &&
                  locationPossibilities.map((loc, idx) => {
                    return (
                      <li  key={`${loc}-${idx}`} data-ix={`${idx}`}
                            className={classnames(kClassSelectOption, {"geoname-candidate": idx === 0})}
                            onClick={(e)=>handlePlaceNameSelection(e)}
                      >
                        {loc.name}
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
