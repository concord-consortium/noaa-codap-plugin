import React, { useState } from "react";
import { useStateContext } from "../hooks/use-state";
import ToggleIcon from "../assets/images/icon-toggle.svg";

import "./attribute-selector.scss";

const kHourlyAttributes = ["Dew Point", "Barometric Pressure at sea level", "Air Temperature", "Visibility",
                            "Wind Direction", "Wind Speed", "Precipitation in last hour"];
const kMonthlyDailyAttributes = ["Average temperature", "Precipitation", "Max temperature", "Min temperature",
                                  "Snowfall", "Average wind speed"];

export const AttributesSelector = () => {
  const {state, setState} = useStateContext();
  const {units} = state;
  const [allSelected, setAllSelected] = useState(false);

  const attributes = state.frequency === "hourly" ? kHourlyAttributes : kMonthlyDailyAttributes;

  const handleUnitsClicked = () => {
    setState(draft => {
      draft.units = draft.units === "standard" ? "metric" : "standard";
    });
  };

  const toggleSelectAllAttrs = () => {
    if (allSelected) {
      setAllSelected(false);
      setState(draft => {
        draft.attributes = [];
      });
    } else {
      setAllSelected(true);
      setState(draft => {
        draft.attributes = state.frequency === "daily" ? kHourlyAttributes : kMonthlyDailyAttributes;
      });
    }

  };

  const toggleAttributeSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    const attrSelected = e.currentTarget.textContent;
    if (allSelected) {
      setAllSelected(false);
    }
    setState(draft => {
      if (allSelected) {
        draft.attributes = [];
      }
      if (attrSelected && draft.attributes.includes(attrSelected)) {
        draft.attributes.splice(draft.attributes.indexOf(attrSelected));
      } else {
        attrSelected && draft.attributes.push(attrSelected);
      }
    });
  };

  return (
    <div className="attribute-selection-container">
      <div className="attribute-selection-header">
        <span className="attributes-title">Attributes</span>
        <div className="units-selection">
          <label className="units-label">Units</label>
          <button className="units-toggle" onClick={handleUnitsClicked}>
            {units}
            <ToggleIcon className="toggle-icon"/>
          </button>
        </div>
      </div>
      <div className="attribute-selection">
        <div className={`attribute-button all ${allSelected ? "selected" : ""}`} onClick={toggleSelectAllAttrs}>
          All
        </div>
        { attributes.map(attr => {
          const attrSelected = state.attributes.includes(attr) && !allSelected;
          return (
            <div key={attr} className={`attribute-button ${attrSelected ? "selected" : ""}`}
              onClick={toggleAttributeSelect}>
              {attr}
            </div>
          );
        })}
      </div>
      <div className="attribute-filters">attribute filters</div>
    </div>
  );
};
