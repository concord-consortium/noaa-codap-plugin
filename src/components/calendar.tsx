
import React from "react";
import { DateCalendar, DateCalendarProps } from "@mui/x-date-pickers";
import { styled } from "@mui/material/styles";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import "./calendar.scss";

interface ICalendarProps {
  header: string;
  isSelected: boolean;
}

const tealDark = "#177991";

export const Calendar = ({header, isSelected}: ICalendarProps) => {

  const cellStyle = {
    width: 21,
    height: 21,
    fontSize: 10,
    fontFamily: "Montserrat",
    margin: 0,
    fontWeight: 500,
    color: "#000",
  };

  const StyledDateCalendar = styled(DateCalendar)<DateCalendarProps<Date>>(({ theme }) => ({
    width: 171,
    ".MuiDayCalendar-root": {
      borderWidth: 0,
      border: "0px solid",
      backgroundColor: isSelected ? "#ddeff1" : "#fff",
      width: 167,
      maxHeight: 150,
      marginTop: 8,
      ".MuiDayCalendar-weekDayLabel": cellStyle,
      ".MuiPickersDay-root": cellStyle,
      ".MuiPickersDay-root:not(.Mui-selected)": {
        border: "none",
      },
      ".MuiPickersDay-root.Mui-selected": {
        color: "#fff",
        backgroundColor: tealDark,
        fontWeight: 800,
      },
      "& .MuiPickersDay-dayWithMargin": {
        borderRadius: "0",
        outline: "1px solid rgba(114, 191, 202, 0.25)",
        margin: "0px 1px 0 0"
      },
      "& .MuiDayPicker-weekContainer": { margin: "1px" }
    },
  }));

  const CalendarHeader = () => {
    return (
      <div className={`header-container ${isSelected && "selected"}`}>
        <div className={"calendar-header"}>{header} date</div>
        <div className={"select-row"}>
          <div className="arrow back"><ArrowBackIosIcon/></div>
          <div className={"select-container"}>
            <select className={"select"}>
              <option>Month</option>
            </select>
            <div className={"select year"}>
              Year
            </div>
          </div>
          <div className="arrow forward"><ArrowForwardIosIcon/></div>
        </div>
      </div>
    )
  }

  return (
    <StyledDateCalendar
      slotProps={{
          calendarHeader: <CalendarHeader />
      }}
      slots={{
        calendarHeader: CalendarHeader,
      }}
    />
  );
};
