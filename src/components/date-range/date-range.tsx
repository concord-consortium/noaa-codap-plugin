import React, { useEffect, useState } from "react";
import { IFrequency } from "../../types";
import { useStateContext } from "../../hooks/use-state";
import { DateSelector } from "./date-selector";
import { Calendars } from "./calendars";
import { constants } from "../../constants";
import WarningIcon from "../../assets/icon-warning.svg";
import ExitIcon from "../../assets/images/icon-exit.svg";

import "./date-range.scss";

export const DateRange = () => {
  const { state, setState } = useStateContext();
  const { selectedFrequency, startDate, endDate } = state;
  const [selectedCalendar, setSelectedCalendar] = useState<string>(); // "start" | "end"
  const [showCalendars, setShowCalendars] = useState(false);
  const [showWarningIcon, setShowWarningIcon] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const frequencies = ["hourly", "daily", "monthly"] as IFrequency[];

  useEffect(() => {
    if (endDate && startDate && selectedFrequency) {
      const ONE_DAY = 24 * 3600 * 1000; // one day in milliseconds
      const ONE_HOUR = 3600 * 1000; // one hour in milliseconds
      const timeDifference = endDate.getTime() - startDate.getTime();
      const frequencyFactor = selectedFrequency === "monthly" ? ONE_DAY * 30 : selectedFrequency === "hourly" ? ONE_HOUR : ONE_DAY;
      const expectedEntries = Math.ceil(timeDifference / frequencyFactor);
      if (expectedEntries > 5000) {
        setShowWarningIcon(true);
      } else {
        setShowWarningIcon(false);
      }
    } else {
      setShowWarningIcon(false);
    }
  }, [selectedFrequency, startDate, endDate]);

  const handleSetFrequency = (freq: IFrequency) => {
    setState(draft => {
      draft.selectedFrequency = freq;
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
    handleSetStartDate(constants.defaultDates[selectedFrequency].start);
    handleSetEndDate(constants.defaultDates[selectedFrequency].end);
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
    if (showWarningIcon) {
      setShowWarningModal(true);
    }
  };

  const handleOuterModalClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      setShowWarningModal(false);
    }
  };

  return (
    <div className="date-range-container">
      <div className="date-range-header">
        <div className="title">Date Range {showWarningIcon && <WarningIcon/>}</div>
        <div className="data-frequency-selection">
          {frequencies.map(freq => {
            return (
              <button
                key={freq}
                className={`frequency-selection ${selectedFrequency === freq ? "selected" : ""}`}
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
      {
        showWarningModal &&
          <div className="warning-modal" onClick={handleOuterModalClick}>
            <div className="warning-container">
              <div className="warning-header">
                <div className="warning-title">Data Return Warning</div>
                <div className="warning-exit" onClick={() => setShowWarningModal(false)}><ExitIcon/></div>
              </div>
              <div className="warning-body">
                Your current range is likely to return too many results, which
                may affect application performance.
              </div>
              <div className="warning-footer">
                <button className="warning-button" onClick={() => setShowWarningModal(false)}>Close</button>
              </div>
            </div>
          </div>
        }
    </div>
  );
};
