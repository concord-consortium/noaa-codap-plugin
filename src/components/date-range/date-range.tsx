import React, { useState } from "react";
import { IFrequency } from "../../types";
import { useStateContext } from "../../hooks/use-state";
import { DateSelector } from "./date-selector";
import { Calendars } from "./calendars";
import { constants } from "../../constants";

import "./date-range.scss";

export const DateRange = () => {
  const { state, setState } = useStateContext();
  const { frequency, startDate, endDate } = state;
  const [selectedCalendar, setSelectedCalendar] = useState<string>(); // "start" | "end"
  const [showCalendars, setShowCalendars] = useState(false);
  const frequencies = ["hourly", "daily", "monthly"] as IFrequency[];

  const handleSetFrequency = (freq: IFrequency) => {
    setState(draft => {
      draft.frequency = freq;
    });
  };

  const handleSetStartDate = (date: Date) => {
    setState(draft => {
      draft.startDate = date;
    });
  };

  const handleSetEndDate = (date: Date) => {
    setState(draft => {
      draft.endDate = date;
    });
  };

  function configureDates() {
    handleSetStartDate(constants.defaultDates[frequency].start);
    handleSetEndDate(constants.defaultDates[frequency].end);
  }

  const handleOpenCalendar = (calendar: string) => {
    setSelectedCalendar(calendar);
    setShowCalendars(true);

    if (!startDate && !endDate) {
      configureDates();
    }
  };

  const handleCloseCalendars = () => {
    setShowCalendars(false);
    setSelectedCalendar(undefined);
  };

  return (
    <div className="date-range-container">
      <div className="date-range-header">
        <span>Date Range</span>
        <div className="data-frequency-selection">
          {frequencies.map(freq => {
            return (
              <button
                key={freq}
                className={`frequency-selection ${frequency === freq ? "selected" : ""}`}
                value={freq}
                onClick={() => handleSetFrequency(freq)}>
                {freq}
              </button>
            );
          })}
        </div>
      </div>
      <div className="date-picker-container">
        <DateSelector
          onOpen={() => handleOpenCalendar("start")}
          value={startDate}
          placeholder="Start date"
          isSelected={selectedCalendar === "start"}
        />
        <span>to</span>
        <DateSelector
          onOpen={() => handleOpenCalendar("end")}
          value={endDate}
          placeholder="End date"
          isSelected={selectedCalendar === "end"}
        />
        {
          showCalendars &&
          <Calendars
            selectedCalendar={selectedCalendar}
            closeCalendars={handleCloseCalendars}
            handleSelectCalendar={(calendar: string) => setSelectedCalendar(calendar)}
          />
        }
      </div>
    </div>
  );
};
