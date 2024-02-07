
import React from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs from "dayjs";

import "./date-selector.scss";

interface IDatePickerCompProps {
  onOpen: () => void;
  placeholder?: string;
  value?: Date;
  isSelected: boolean;
}

export const DateSelector = ({onOpen, isSelected, placeholder, value}: IDatePickerCompProps) => {
  const placeHolderClass = !value ? "placeholder" : "";
  const selectedClass = isSelected ? "selected" : "";
  return (
    <div className={`date-selector ${placeHolderClass} ${selectedClass}`} onClick={onOpen}>
      <span title="Select a date">
        <CalendarMonthIcon/>
      </span>
      {value ? dayjs(value).format("MM/DD/YYYY") : placeholder}
    </div>
  );
};
