
import React from "react";
import dayjs from "dayjs";
import { useStateContext } from "../../hooks/use-state";
import { IState } from "../../types";
import { CalendarHeader } from "./calendar-header";

import "./calendar.scss";

interface ICalendar {
  calendarType: "start" | "end";
  handleSelectCalendar: () => void;
}

export const Calendar = ({calendarType, handleSelectCalendar}: ICalendar) => {
  const { state, setState } = useStateContext();
  const {startDate, endDate} = state;

  if (!startDate || !endDate) {
    return null;
  }

  const selectedDate = calendarType === "start" ? startDate : endDate;
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();
  const day = selectedDate.getDate();
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSetDate = (date: Date) => {
    const key = calendarType === "start" ? "startDate" : "endDate";
    setState((draft: IState) => {
      draft[key] = date;
    });
  };

  const handleDateClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    const htmlTarget = e.target as HTMLTableCellElement;
    const isSpan = htmlTarget.tagName === "SPAN";
    const el = isSpan ? htmlTarget.parentElement : htmlTarget;
    if (el) {
      const d = Number(el.getAttribute("data-date"));
      const m = Number(el.getAttribute("data-month"));
      const y = Number(el.getAttribute("data-year"));
      handleSetDate(new Date(y, m, d));
    }
    handleSelectCalendar();
  };

  const renderMonth = () => {
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    const daysInMonth = (iMonth: number, iYear: number) => {
      return 32 - new Date(iYear, iMonth, 32).getDate();
    };

    const firstDay = (new Date(year, month)).getDay();

    const inShadedDateRange = (d: number) => {
      const date = new Date(year, month, d);
      return (dayjs(date).isAfter(startDate) && dayjs(date).isBefore(endDate));
    };

    const rows = [];
    let cell;
    let dayNum = 1;

    for (let i = 0; i < 6; i++) {
      const row = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          cell = <td key={j}></td>;
          row.push(cell);
        } else if (dayNum > daysInMonth(month, year)) {
          break;
        } else {
          const selectedClass = day === dayNum ? "selected" : "";
          const shadedClass = !selectedClass && inShadedDateRange(dayNum) ? "in-range" : "";
          cell = (
            <td
              key={j}
              data-date={dayNum}
              data-month={month}
              data-year={year}
              onClick={handleDateClick}
              data-month_name={months[month]}
              className={`day-picker ${selectedClass} ${shadedClass}`}
            >
              <span>{dayNum}</span>
            </td>
          );
          row.push(cell);
          dayNum++;
        }
      }
      rows.push(<tr key={i}>{row}</tr>);
    }
    return rows;
  };

  return (
    <>
      <CalendarHeader calendarType={calendarType}/>
      <table className={`table-calendar`}>
        <thead className={`thead-month`}>
          <tr>
            {days.map((d) => {
              return (
                <th key={d} data-day={d}>
                  {d}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={`calendar-body`}>
          {renderMonth()}
        </tbody>
      </table>
    </>
  );
};
