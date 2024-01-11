import React from "react";
import { App } from "./App";
import { StateContext, useStateContextInAppContainerOnly } from "../hooks/use-state";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export const AppContainer = () => {
  const stateContext = useStateContextInAppContainerOnly();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StateContext.Provider value={stateContext}>
        <App />
      </StateContext.Provider>
    </LocalizationProvider>
  );
};
