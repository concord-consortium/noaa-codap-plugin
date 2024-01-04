import React from "react";
import OpenMapIcon from "../assets/icon-map.svg";
import EditIcon from "../assets/icon-edit.svg";
import LocationIcon from "../assets/icon-location.svg";

import "./location-picker.scss";

export const LocationPicker = () => {
  const handleOpenMap = () => {
    //send request to CODAP to open map with available weather stations
  };
  return (
    <div className="location-picker-container">
      <div className="location-header">
        <span>Location</span>
        <div className="selected-weather-station">
          <span>Selected weather station</span>
          <EditIcon />
        </div>
      </div>
      <div className="location-input-container">
        <div className="location-input">
          <LocationIcon />
          <span>location</span>
        </div>
        <button className="map-button" onClick={handleOpenMap}>
          <OpenMapIcon />
        </button>
      </div>
    </div>
  );
};
