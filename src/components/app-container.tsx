import React from "react";
import { App } from "./App";
import { StateContext, useStateContextInAppContainerOnly } from "../hooks/use-state";

export const AppContainer = () => {
  const stateContext = useStateContextInAppContainerOnly();

  return (
    <StateContext.Provider value={stateContext}>
      <App />
    </StateContext.Provider>
  );
};
