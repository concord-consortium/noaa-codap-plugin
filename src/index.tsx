import React from "react";
import { createRoot } from "react-dom/client";
import { AppContainer } from "./components/app-container";

import "./index.scss";

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<AppContainer />);
}
