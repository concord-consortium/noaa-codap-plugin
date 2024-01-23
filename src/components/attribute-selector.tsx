import React, { useState } from "react";
import classnames from "classnames";
import { useStateContext } from "../hooks/use-state";
import { dailyMonthlyAttrMap, hourlyAttrMap } from "../types";

import "./attribute-selector.scss";

export const AttributesSelector = () => {
  const {state, setState} = useStateContext();
  const {units} = state;
  const [allSelected, setAllSelected] = useState(false);
  const hourlyAttributeNames = hourlyAttrMap.map(attr => { return attr.name; });
  const dailyMonthlyAttributeNames = dailyMonthlyAttrMap.map(attr => { return attr.name; });

  const attributes = state.frequency === "hourly" ? hourlyAttributeNames : dailyMonthlyAttributeNames;

  const handleUnitsClicked = () => {
    setState(draft => {
      draft.units = draft.units === "standard" ? "metric" : "standard";
    });
  };

  const toggleSelectAllAttrs = () => {
    if (allSelected) {
      setAllSelected(false);
      setState(draft => {
        draft.attributes = [];
      });
    } else {
      setAllSelected(true);
      setState(draft => {
        draft.attributes = state.frequency === "hourly" ? hourlyAttributeNames : dailyMonthlyAttributeNames;
      });
    }

  };

  const toggleAttributeSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    const attrSelected = e.currentTarget.textContent;
    if (allSelected) {
      setAllSelected(false);
    }
    setState(draft => {
      if (allSelected) {
        draft.attributes = [];
      }
      if (attrSelected && draft.attributes.includes(attrSelected)) {
        draft.attributes.splice(draft.attributes.indexOf(attrSelected));
      } else {
        attrSelected && draft.attributes.push(attrSelected);
      }
    });
  };

  return (
    <div className="attribute-selection-container">
      <div className="attribute-selection-header">
        <span className="attributes-title">Attributes</span>
        <div className="units-selection">
          <label className="units-label">Units</label>
          <button className={classnames("units-switch left", {"selected-unit": units === "standard"})} onClick={handleUnitsClicked}>Standard</button>
          <button className={classnames("units-switch right",{"selected-unit": units === "metric"} )} onClick={handleUnitsClicked}>Metric</button>
        </div>
      </div>
      <div className="attribute-selection">
        <div className={`attribute-button all ${allSelected ? "selected" : ""}`} onClick={toggleSelectAllAttrs}>
          All
        </div>
        { attributes.map(attr => {
          const attrSelected = state.attributes.includes(attr) && !allSelected;
          return (
            <div key={`${attr}-button`} className={`attribute-button ${attrSelected ? "selected" : ""}`}
              onClick={toggleAttributeSelect}>
              {attr}
            </div>
          );
        })}
      </div>
    </div>
  );
};
