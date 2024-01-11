import React from "react";
import { useStateContext } from "../hooks/use-state";

import "./info-modal.scss";

export const InfoModal = () => {
  const {setState} = useStateContext();

  const handleCloseModal = () => {
    setState(draft => {
      draft.showModal = undefined;
    });
  };

  return (
    <div className="info-modal">
      <div className="modal-header">
        More Information
      </div>
      <div className="modal-body">
        <div className="info-title">About</div>
        <div className="info-container">
          <p>These weather data come from the National Centers for Environmental Information(NCEI), part of the National Oceanic and Atmospheric Administration (NOAA). Documentation is available at
            <a href="https://www.ncei.noaa.gov" target="_blank" rel="noreferrer">https://www.ncei.noaa.gov</a>.
          </p>
          <p>This weather data portal was developed by
            <a href="https://concord.org" target="_blank" rel="noreferrer">The Concord Consortium</a> as part of the
            <a href="https://www.edc.org/weatherx" target="_blank" rel="noreferrer">WeatherX Project—Strategies:
              Understanding Weather Extremes with Big Data: Inspiring Rural Youth in Data Science
            </a> at the <a href="http://edc.org/" target="_blank" rel="noreferrer">Education Development Center</a>.
          </p>
          <p>This material is based on work supported by the National Science Foundation under Grant No. DRL-1850477. Any opinions, findings, and conclusions or recommendations expressed in this material are those of the authors and do not necessarily reflect the views of the NSF.</p>
        </div>
      </div>
      <div className="modal-footer">
        <button className="modal-button" onClick={handleCloseModal}>Close</button>
      </div>
    </div>
  );
};
