import React from "react";
import "./calendars.scss";
import { Calendar } from "./calendar";

interface ICalendarsProps {
  selectedCalendar: string|undefined;
}

export const Calendars = ({selectedCalendar}: ICalendarsProps) => {
  return (
    <div className="modal">
      <div className={"calendar-container"}>
        <div className={`calendar-column ${selectedCalendar === "start" && "selected"}`}>
          <Calendar header="Start" isSelected={selectedCalendar === "start"} />
        </div>
        <div className={`calendar-column${selectedCalendar === "end" && "selected"}`}>
          <Calendar header="End" isSelected={selectedCalendar === "end"}/>
        </div>
      </div>
    </div>
  );
};
