import React, { useState } from "react";

import "./date-range.scss";

export const DateRange = () => {
  const [selected, setSelected] = useState("monthly");
  const frequency = ["hourly", "daily", "monthly"];
  return (
    <div className="date-range-container">
      <div className="date-range-header">
        <span>Date Range</span>
        <div className="data-frequency-selection">
          {frequency.map(freq => {
            return (
              <button key={freq} className={`frequency-selection ${selected ? "selected" : ""}`}
                        onClick={()=>setSelected(freq)}>
                {freq}
              </button>
            );
          })}
        </div>
        <div className="date-range-container">
          <div className="date-picker"></div>
          <span>to</span>
          <div className="date-picker"></div>
        </div>
      </div>

    </div>
  );
};
