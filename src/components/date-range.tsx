import React, { useState } from "react";

import "./date-range.scss";

export const DateRange = () => {
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");
  const frequency = ["hourly", "daily", "monthly"];

  const handleFrequencySelection = (e: React.MouseEvent) => {
    const target = e.target as HTMLButtonElement;
    setSelectedFrequency(target.value);
  }

  return (
    <div className="date-range-container">
      <div className="date-range-header">
        <span>Date Range</span>
        <div className="data-frequency-selection">
          {frequency.map(freq => {
            return (
              <button
                key={freq}
                className={`frequency-selection ${selectedFrequency === freq ? "selected" : ""}`}
                value={freq}
                onClick={handleFrequencySelection}>
                {freq}
              </button>
            );
          })}
        </div>
      </div>
      <div className="date-picker-container">
        <div className="date-picker"></div>
        <span>to</span>
        <div className="date-picker"></div>
      </div>
    </div>
  );
};
