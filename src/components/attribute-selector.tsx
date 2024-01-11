import React from "react";
import { useStateContext } from "../hooks/use-state";

import "./attribute-selector.scss";

export const AttributesSelector = () => {
  const {state, setState} = useStateContext();
  const {units} = state;

  const selected = false;
  const attributes = ["All", "Average temperature", "Precipitation", "Max temperature", "Min temperature",
                        "Snowfall", "Average wind speed"];

  const handleUnitsClicked = () => {
    setState(draft => {
      draft.units = draft.units === "standard" ? "metric" : "standard";
    });
  };

  return (
    <div className="attribute-selection-container">
      <div className="attribute-selection-header">
        <span>Attributes</span>
        <div className="units-selection">
          <label>Units</label>
          <button onClick={handleUnitsClicked}>{units}</button>
        </div>
        <div className="attribute-selection">
          { attributes.map(attr => {
            return (
              <div key={attr} className={`attribute-button ${selected ? "selected" : ""}`}>{attr}</div>
            );
          })}
        </div>
        <div className="attribute-filters">attribute filters</div>
      </div>
    </div>
  );
};
