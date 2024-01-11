
import React from "react";
import { DatePicker, DatePickerProps } from "@mui/x-date-pickers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { styled } from "@mui/material/styles";
import { InputAdornmentProps } from "@mui/material";

interface IDatePickerCompProps {
  onOpen: () => void;
  placeholder?: string;
  value?: Date;
}

export const DateSelector = ({onOpen, placeholder, value}: IDatePickerCompProps) => {
  const StyledDatePicker = styled(DatePicker)<DatePickerProps<Date>>(({ theme }) => ({
    width: 138,
    border: "1px solid #177991",
    borderRadius: 3,
    boxSizing: "border-box",
    ".MuiFormLabel-root": {
      backgroundColor: "#fff",
      fontFamily: "Montserrat",
      fontSize: 14,
      color: "#177991",
    },
    "& .MuiInputBase-root": {
      fontFamily: "Montserrat",
      fontSize: 12,
      height: 32,
      paddingLeft: 7,
      paddingRight: 7,
      cursor: "pointer",
      ".MuiOutlinedInput-notchedOutline": {
        border: "none"
      },
      ".MuiSvgIcon-root": {
        width: 18,
        height: 18,
        marginRight: 8,
        fill: "#177991",
        cursor: "pointer",
      },
      ".MuiInputBase-input": {
        fontStyle: value ? "normal" : "italic",
        cursor: "pointer",
      }
    },
  }));

  return (
    <StyledDatePicker
      open={false}
      slots={{
        inputAdornment: CalendarMonthIcon as React.ElementType<InputAdornmentProps> | undefined,
      }}
      slotProps={{
        inputAdornment: {
          position: "start",
          onClick: onOpen,
        },
        textField: {
          placeholder,
          onClick: onOpen,
        }
      }}
    />
  );
}