import React, { useEffect, useState } from "react";
import { Calendar } from "./calendar";
import { useStateContext } from "../../hooks/use-state";

import "./calendars.scss";

interface ICalendarsProps {
  selectedCalendar: string | undefined;
  handleSelectCalendar: (calendar: string) => void;
  closeCalendars: () => void;
}

export const Calendars = ({selectedCalendar, handleSelectCalendar, closeCalendars}: ICalendarsProps) => {
  const { state } = useStateContext();
  const { weatherStation } = state;
  const [activeDates, setActiveDates] = useState<{from: string, to: string}>({from: "", to: ""});

  useEffect(() => {
    if (weatherStation) {
      const {mindate, maxdate} = weatherStation; //"1973-01-01"
      const formatDate = (date: string) => {
        const [year, month, day] = date.split("-");
        return `${month}/${day}/${year}`;
      };
      const from = formatDate(mindate);
      const to = maxdate === "present" ? "present" : formatDate(maxdate);
      setActiveDates({from, to});
    }
  }, [weatherStation]);

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
            { weatherStation &&
              <>
                <div className="station-name">{weatherStation?.name || "WEATHER STATION"}</div>
                <div className="station-dates">
                  <span>{activeDates.from}</span> - <span>{activeDates.to}</span>
                </div>
              </>
            }
          </div>
        <button className="close-calendar" onClick={closeCalendars} title="Submit date range selection">Done</button>
      </div>
    </div>
  );
};
