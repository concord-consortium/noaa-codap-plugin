import React, { useEffect, useRef, useState } from "react";
import classnames from "classnames";
import { IPlace, autoComplete } from "../utils/geonameSearch";
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
  const [showMapButton, setShowMapButton] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<IPlace | undefined>(undefined);
  const [locationPossibilities, setLocationPossibilities] = useState<IPlace[]>([]);
  const [showSelectionList, setShowSelectionList] = useState(false);
  const locationDivRef = useRef<HTMLDivElement>(null);
  const locationInputEl = useRef<HTMLInputElement>(null);
  const locationSelectionListEl = useRef<HTMLDivElement>(null);

  // const {state, setState} = useStateContext();

  const handleOpenMap = () => {
    //send request to CODAP to open map with available weather stations
  };

  const handleLocationInputClick = () => {
    setSelectedStation("station");
  };

  useEffect(() => {
    if (locationInputEl.current?.value === "") {
      setShowSelectionList(false);
    }
  }, [locationInputEl.current?.value]);

  useEffect(() => {
    const currentLocationInput = locationDivRef.current;
    if (currentLocationInput) {
      setShowMapButton(true);
    }
    }, []);

    function handleKeyDown(ev: React.KeyboardEvent<HTMLDivElement>) {
      if (ev.key === "Enter") {
        if (locationInputEl.current) {
          autoComplete(locationInputEl.current)
            .then ((placeList: IPlace[] | undefined) => {
                      if (placeList) {
                        setLocationPossibilities(placeList);
                        console.log("placeList length", placeList.length);
                        placeList.length > 0 && setShowSelectionList(true);
                        setIsEditing(false);
                        setSelectedLocation(undefined);
                      }
                  });

        }
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
    }

    function handlePlaceNameSelection(ev: React.MouseEvent<HTMLDivElement>) {
      const target = ev.currentTarget;
      const selectedLocIdx = target.dataset.ix && parseInt(target.dataset.ix, 10);
      if (selectedLocIdx && selectedLocIdx >= 0) {
        setSelectedLocation(locationPossibilities[selectedLocIdx]);
        setShowSelectionList(false);
      }
    }

  const handleFindCurrentLocation = async() => {
    navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
      setSelectedLocation({name: "current location", lat: position.coords.latitude, long: position.coords.longitude});
    });
  };

console.log("input value", locationInputEl.current?.value);
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
        <div className="location-input-selection">
          <div ref={locationDivRef} className={classnames("location-input-wrapper", {"short" : showMapButton})}
                onClick={handleLocationInputClick}>
            <LocationIcon />
            {selectedLocation && !isEditing
                ? <div onClick={() => setIsEditing(true)}>
                    <span className="selected-loc-intro">Stations near </span>
                    <span className="selected-loc-name">{selectedLocation?.name}</span>
                  </div>
                : <input ref={locationInputEl} className="location-input" type="text" placeholder={kPlaceholderText}
                    onKeyDown={handleKeyDown} />
            }
          </div>
          <div
            ref={locationSelectionListEl}
            className={classnames("location-selection-list", {"short" : showMapButton, "show": showSelectionList})}
            onClick={handlePlaceNameSelection}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div className="list-current-location">
              <div className="current-location-wrapper" onClick={handleFindCurrentLocation}>
                <CurrentLocationIcon className="current-location-icon"/>
                <span className="current-location">Use current location</span>
              </div>
            </div>
            <div className="location-selector-options">
              {locationPossibilities.length > 0 &&
                  locationPossibilities.map((loc, idx) => {
                    return (
                      <div  key={`${loc}-${idx}`} data-ix={`${idx}`}
                            className={classnames(kClassSelectOption, {"geoname-candidate": idx === 0})}
                            onClick={(e)=>handlePlaceNameSelection(e)}
                      >
                        {loc.name}
                      </div>
                    );
                  })
                }
            </div>
          </div>
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
