import React, { useEffect } from "react";
import { IFrequency } from "../types";

import "./date-range.scss";
import { useStateContext } from "../hooks/use-state";
import { DateCalendar } from "@mui/x-date-pickers";
import { DateSelector } from "./date-selector";
import { Calendars } from "./calendars";

export const DateRange = () => {
  const { state, setState } = useStateContext();
  const { frequency, startDate, endDate } = state;
  const [selectedCalendar, setSelectedCalendar] = React.useState<string>(); // "start" | "end"
  const [showCalendars, setShowCalendars] = React.useState(false);
  const frequencies = ["hourly", "daily", "monthly"] as IFrequency[];

  const handleSetFrequency = (frequency: IFrequency) => {
    setState(draft => {
      draft.frequency = frequency;
    });
  };

  const handleSetStartDate = (date: Date) => {
    setState(draft => {
      draft.startDate = date;
    });
  };

  const handleSetEndDate = (date: Date) => {
    setState(draft => {
      draft.startDate = date;
    });
  };

  const handleOpenCalendar = (calendar: string) => {
    setSelectedCalendar(calendar);
    setShowCalendars(true);
  }

  useEffect(() => {
    console.log("selectedCalendars", selectedCalendar, showCalendars);
  }, [selectedCalendar, showCalendars])

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
        />
        <span>to</span>
        <DateSelector
          onOpen={() => handleOpenCalendar("start")}
          value={endDate}
          placeholder="End date"
        />
        { showCalendars &&
          <Calendars
            selectedCalendar={selectedCalendar}
          />
        }
      </div>
    </div>
  );
};
