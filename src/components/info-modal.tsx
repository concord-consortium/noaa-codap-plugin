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
        <div className="info-container" title="About this plugin">
          <p>These weather data come from the National Centers for Environmental Information (NCEI), part of the National Oceanic and Atmospheric Administration. Documentation is available at
            <a href="https://www.ncei.noaa.gov" target="_blank" rel="noreferrer"> https://www.ncei.noaa.gov</a>.
          </p>
          <p>This weather data portal was developed by <a href="https://concord.org" target="_blank" rel="noreferrer">The Concord Consortium</a> as part of the <a href="https://www.edc.org/weatherx" target="_blank" rel="noreferrer">WeatherX</a> at the <a href="http://edc.org/" target="_blank" rel="noreferrer">Education Development Center</a>,
            and the <a href="https://mss.wested.org/project/boosting-data-science-teaching-and-learning-in-stem/"target="_blank" rel="noreferrer">Boosting Data Science</a> project at <a href="https://www.wested.org/"target="_blank" rel="noreferrer">WestEd</a>.
          </p>
          <p>This material is based on work supported by the National Science Foundation under Grant No. DRL-1850477 and DLR-2101049. Any opinions, findings, and conclusions or recommendations expressed in this material are those of the authors and do not necessarily reflect the views of the National Science Foundation.</p>
        </div>
      </div>
      <div className="modal-footer">
        <button className="modal-button" onClick={handleCloseModal} title="Hide this section">Close</button>
      </div>
    </div>
  );
};
