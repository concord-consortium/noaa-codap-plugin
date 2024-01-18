import React from "react";
import { useStateContext } from "../hooks/use-state";

import ExitIcon from "../assets/images/icon-exit.svg";

import "./data-return-warning.scss";

export const DataReturnWarning = () => {
  const {setState} = useStateContext();

  const handleCloseModal = () => {
    setState(draft => {
      draft.showModal = undefined;
    });
  };

  return (
    <>
      <div className="data-return-warning-background" onClick={handleCloseModal} />
      <div className="data-return-warning">
        <div>
          Data Return Warning <ExitIcon onClick={handleCloseModal} />
        </div>
        <div>
          Your current date range is likely to return too many results, which may affect application performance.
        </div>
        <div>
          <button onClick={handleCloseModal}>Close</button>
        </div>
      </div>
    </>
  );
};
