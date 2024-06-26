import React from "react";
import { useStateContext } from "../../hooks/use-state";
import { IState } from "../../types";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import dayjs from "dayjs";

import "./calendar-header.scss";

interface ICalendarHeader {
  calendarType: "start" | "end";
  handleSelectCalendar: () => void;
}

export const CalendarHeader = ({calendarType, handleSelectCalendar}: ICalendarHeader) => {
  const { state, setState } = useStateContext();
  const {startDate, endDate} = state;

  if (!startDate || !endDate) {
    return null;
  }

  const selectedDate = calendarType === "start" ? startDate : endDate;
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();
  const day = selectedDate.getDate();

  const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const title = calendarType === "start" ? "Start date" : "End date";

  const handleSetDate = (date: Date) => {
    const key = calendarType === "start" ? "startDate" : "endDate";
    const isValidDate = calendarType === "start" ? dayjs(date).isBefore(endDate) : dayjs(date).isAfter(startDate);
    if (isValidDate) {
      setState((draft: IState) => {
        draft[key] = date;
      });
    }
  };

  const handleNext = () => {
    const newYear = (month === 11) ? year + 1 : year;
    const newMonth = (month + 1) % 12;
    handleSetDate(new Date(newYear, newMonth, day));
    handleSelectCalendar();
  };

  const handlePrevious = () => {
    const newYear = (month === 0) ? year - 1 : year;
    const newMonth = (month === 0) ? 11 : month - 1;
    handleSetDate(new Date(newYear, newMonth, day));
    handleSelectCalendar();
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = Number(e.target.value);
    handleSetDate(new Date(year, newMonth, day));
    handleSelectCalendar();
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = Number(e.target.value);
    handleSetDate(new Date(newYear, month, day));
    handleSelectCalendar();
  };

  return (
    <div className={"header-container"}>
      <div className={`calendar-header`}>{title}</div>
        <div className={`select-row`}>
          <div className={`arrow back`} onClick={handlePrevious}><ArrowBackIosIcon/></div>
            <div className={`select-container`}>
              <select className={`month select`} value={month} onChange={handleMonthChange}>
                {monthShortNames.map((msn, ix) => {
                  return (
                    <option key={ix} value={ix}>
                      {msn}
                    </option>
                  );
                })}
              </select>
              <select className={`year select`} value={year} onChange={handleYearChange}>
                {Array.from({length: new Date().getFullYear() - 1850 + 1}, (_, i) => i + 1850).map((_year, ix) => {
                  return (
                    <option key={ix} value={_year}>
                      {_year}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className={`arrow next`} onClick={handleNext}><ArrowForwardIosIcon/></div>
        </div>
    </div>
  );
};
