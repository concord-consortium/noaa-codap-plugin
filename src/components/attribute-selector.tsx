import React, { useState } from "react";

import "./attribute-selector.scss";

export const AttributesSelector = () => {
  const [selected, setSelected] = useState("standard");
  const attributes = ["All", "Average temperature", "Precipitation", "Max temperature", "Min temperature",
                        "Snowfall", "Average wind speed"];
  return (
    <div className="attribute-selection-container">
      <div className="attribute-selection-header">
        <span>Attributes</span>
        <div className="units-selection">
          <label>Units</label>
          <button>standard</button>
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
