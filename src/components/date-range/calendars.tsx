import React from "react";
import "./calendars.scss";
import { Calendar } from "./calendar";
import { useStateContext } from "../../hooks/use-state";

interface ICalendarsProps {
  selectedCalendar: string | undefined;
  handleSelectCalendar: (calendar: string) => void;
  closeCalendars: () => void;
}

export const Calendars = ({selectedCalendar, handleSelectCalendar, closeCalendars}: ICalendarsProps) => {
  const {state} = useStateContext();
  const {weatherStation} = state;

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
      <div className="calendar-footer">
        <div className="station-information">
          <div className="station-name">{weatherStation?.name || "WEATHER STATION"}</div>
          <div className="station-dates">
            <span>MM/DD/YYYY</span> - <span>MM/DD/YYYY</span>
          </div>
        </div>
        <button className="close-calendar" onClick={closeCalendars}>Done</button>
      </div>
    </div>
  );
};
