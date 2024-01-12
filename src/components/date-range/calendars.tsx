import React from "react";
import "./calendars.scss";
import { Calendar } from "./calendar";

interface ICalendarsProps {
  selectedCalendar: string|undefined;
  handleSelectCalendar: (calendar: string) => void
}

export const Calendars = ({selectedCalendar, handleSelectCalendar}: ICalendarsProps) => {
  return (
    <div className="modal">
      <div className={"calendar-container"}>
        <div className={`calendar-column ${selectedCalendar === "start" && "selected"}`}>
          <Calendar calendarType="start" handleSelectCalendar={() => handleSelectCalendar("start")}/>
        </div>
        <div className={`calendar-column ${selectedCalendar === "end" && "selected"}`}>
          <Calendar calendarType="end" handleSelectCalendar={() => handleSelectCalendar("end")}/>
        </div>
      </div>
    </div>
  );
};
