import React, { useEffect, useRef, useState } from "react";
import classnames from "classnames";
import { autoComplete } from "../utils/geonameSearch";
import OpenMapIcon from "../assets/images/icon-map.svg";
import EditIcon from "../assets/images/icon-edit.svg";
import LocationIcon from "../assets/images/icon-location.svg";
// import CurrentLocationIcon from "../assets/images/icon-current-location.svg";

import "./location-picker.scss";

// type LocationType = {
//   lat: number, long: number, name: string
// };

// const kGeonamesService = "https://secure.geonames.org/search";
// const kGeolocService = "https://secure.geonames.org/findNearbyPlaceNameJSON";
// const kMinQueryInterval = 800;
const kDefaultMaxRows = 5;
// const kMinNameLength = 3;
const kPlaceholderText = "Enter location or identifier here";

const kClassGeoNameInput = "geo-name-select";
const kClassSelectList = "geoname-selection-list";
const kClassSelectOption = "geoname-selector-option";
const kClassHidden = "geoname-hidden";
const kClassCandidate = "geoname-candidate";

export const LocationPicker = () => {
  // const [queryInProgress, setQueryInProgress] = useState(false);
  // const [editing, setEditing] = useState(false);
  const [showMapButton, setShowMapButton] = useState(true);
  // const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  // const [filteredLocations, setFilteredLocations] = useState<LocationType[] | null>(null);
  const [selectedStation, setSelectedStation] = useState("");
  const locationDivRef = useRef<HTMLDivElement>(null);
  const locationInputEl = useRef<HTMLInputElement>(null);
  const selectionListEl = useRef<HTMLDivElement>(null);

  const handleOpenMap = () => {
    //send request to CODAP to open map with available weather stations
  };

  // const handleLocationInput = (location: { latitude: number, longitude: number, name: string }) => {
  //   setFilteredLocations([{lat: location.latitude, long: location.longitude, name: location.name}]);
  // };

  const handleLocationInputClick = () => {
    // setEditing(true);
    setSelectedStation("station");
  };

  // const handleLocationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   switch (e.key) {
  //     case "Escape":
  //       setEditing(false);
  //       break;
  //     case "Tab":
  //     case "Enter":
  //       setEditing(false);
  //       break;
  //     default:
  //       // locationInputRef.current.value = e.target;
  //   }
  // };

  // useEffect(() => {
  //   if (locationDivRef.current) {
  //     new GeonameSearch(locationDivRef.current, "codap",  handleLocationInput);
  //   }
  // },[]);

  useEffect(() => {
    const currentLocationInput = locationDivRef.current;
    if (currentLocationInput) {
      setShowMapButton(true);
    }
    }, []);

    function handleKeyDown(ev: React.KeyboardEvent<HTMLDivElement>) {
      let selectorHidden = selectionListEl.current?.classList.contains(kClassHidden);
      // let option = selectionListEl.current?.querySelector("." + kClassCandidate);
      if (ev.key === "Enter") {
        if (selectorHidden && selectionListEl.current) {
          if (locationInputEl.current) {
            autoComplete(locationInputEl.current, selectionListEl.current);
          }
          ev.stopPropagation();
        }
        //  else {
        //   if (option) {
        //     inputEl.value = option.innerText;
        //     selectedPlace = placeList[Number(option.attributes.dataix.value)];
        //     selectionHandler(selectedPlace);
        //     selectionListEl.classList.add(kClassHidden);
        //   }
        // }
      } else if (ev.key === "ArrowDown") {
        if (!selectorHidden) {
          let currentCandidateEl = selectionListEl.current?.querySelector("." + kClassCandidate );
          let currentIx = currentCandidateEl && currentCandidateEl.getAttribute("dataix");
          let nextIx = (currentIx != null) && Math.min(Number(currentIx) + 1, kDefaultMaxRows);
          if (nextIx && Number(currentIx) !== nextIx) {
            let optionEls = selectionListEl.current?.querySelectorAll(`.${kClassSelectOption}`);
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
        if (!selectorHidden) {
          let currentCandidateEl = selectionListEl.current?.querySelector("." + kClassCandidate );
          let currentIx = currentCandidateEl && currentCandidateEl.getAttribute("dataix");
          let nextIx = (currentIx != null) && Math.max(Number(currentIx) - 1, 0);
          if ((nextIx != null) && Number(currentIx) !== nextIx) {
            let optionEls = selectionListEl.current?.querySelectorAll(`.${kClassSelectOption}`);
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
      // else {
      //   // let value = value;
      //   selectedPlace = null;
      //   if (value.length >= kMinNameLength) {
      //     if (timer) {
      //       clearTimeout(timer);
      //     }
      //     timer = setTimeout(handleTimeout, kMinQueryInterval);
      //   }
      // }
    }

    function handlePlaceNameSelection(ev: React.MouseEvent<HTMLDivElement>) {
      const target = ev.target;
      console.log("in handlePlaceNameSelection target", target);
      // if (target.classList.contains(kClassSelectOption)) {
      //   inputEl.value = target.innerText;
      //   selectedPlace = placeList[Number(target.attributes.dataix.value)];
      //   selectionHandler(selectedPlace);
      // }
      // classList.add(kClassHidden);
    }

  const handleHover = (ev: React.MouseEvent<HTMLDivElement>) => {
      const target = ev.target;
      console.log("handleHover target", target);
      // if (target.classList.contains(kClassSelectOption)) {
      //   selectionListEl.current?.querySelectorAll("." + kClassCandidate).forEach(function (el) {
      //     el.classList.remove(kClassCandidate);
      //   });
      //   target.classList.add(kClassCandidate);
      //   ev.stopPropagation();
      // }
    };

  return (
    <div className="location-picker-container">
      <div className="location-header">
        <span>Location</span>
        <div className="selected-weather-station">
          <span>{selectedStation}</span>
          <EditIcon />
        </div>
      </div>
      <div className="location-input-container">
        <div ref={locationDivRef} className={classnames("location-input", {"short" : showMapButton})} onClick={handleLocationInputClick}>
          <LocationIcon />
          <input
            ref={locationInputEl}
            className={kClassGeoNameInput}
            type="text"
            placeholder={kPlaceholderText}
            onKeyDown={handleKeyDown}
          />
          <div
            ref={selectionListEl}
            className={`${kClassSelectList} ${kClassHidden}`}
            onMouseOver={handleHover}
            onClick={handlePlaceNameSelection}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          />
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
