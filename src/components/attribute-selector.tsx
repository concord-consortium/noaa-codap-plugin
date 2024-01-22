import React, { useState } from "react";
import { useStateContext } from "../hooks/use-state";
import ToggleIcon from "../assets/images/icon-toggle.svg";

import "./attribute-selector.scss";
import { dailyMonthlyAttrMap, hourlyAttrMap } from "../types";

export const AttributesSelector = () => {
  const {state, setState} = useStateContext();
  const {units, frequencies, selectedFrequency} = state;
  const [allSelected, setAllSelected] = useState(false);
  const hourlyAttributeNames = hourlyAttrMap.map(attr => { return attr.name; });
  const dailyMonthlyAttributeNames = dailyMonthlyAttrMap.map(attr => { return attr.name; });
  const attributeList = selectedFrequency === "hourly" ? hourlyAttrMap : dailyMonthlyAttrMap;
  const attributeNamesList = selectedFrequency === "hourly" ? hourlyAttributeNames : dailyMonthlyAttributeNames;
  const selectsForFrequency = frequencies[selectedFrequency];

  const handleUnitsClicked = () => {
    setState(draft => {
      draft.units = draft.units === "standard" ? "metric" : "standard";
    });
  };

  const toggleSelectAllAttrs = () => {
    const filters = selectsForFrequency.filters;
    if (allSelected) {
      setAllSelected(false);
      setState(draft => {
        draft.frequencies[selectedFrequency] = {attrs: [], filters};
      });
    } else {
      setAllSelected(true);
      setState(draft => {
        draft.frequencies[selectedFrequency] =
          state.selectedFrequency === "hourly" ? {attrs: hourlyAttrMap, filters}
                                                : {attrs: dailyMonthlyAttrMap, filters};
      });
    }
  };

  const toggleAttributeSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    const selectedAttrName = e.currentTarget.textContent;
    const selectedAttr = attributeList.find(a => a.name === selectedAttrName);
    const filters = selectsForFrequency.filters;
    setState(draft => {
      const draftAttrNames = draft.frequencies[selectedFrequency].attrs.map(a => {return a.name;});
      if (allSelected) {
        setAllSelected(false);
        draft.frequencies[selectedFrequency] = {attrs: [], filters};
        selectedAttr && draft.frequencies[selectedFrequency].attrs.push(selectedAttr);
      }
      if (selectedAttrName) {
        const attrIndex = draftAttrNames.indexOf(selectedAttrName);
        if (selectedAttr) {
          if (draftAttrNames.includes(selectedAttrName)) {
            if (attrIndex !== null) {
              draft.frequencies[selectedFrequency].attrs.splice(attrIndex, 1);
            }
          } else {
            draft.frequencies[selectedFrequency].attrs.push(selectedAttr);
          }
        }
      }
    });
  };

  return (
    <div className="attribute-selection-container">
      <div className="attribute-selection-header">
        <span className="attributes-title">Attributes</span>
        <div className="units-selection">
          <label className="units-label">Units</label>
          <button className="units-toggle" onClick={handleUnitsClicked}>
            {units}
            <ToggleIcon className="toggle-icon"/>
          </button>
        </div>
      </div>
      <div className="attribute-selection">
        <div className={`attribute-button all ${allSelected ? "selected" : ""}`} onClick={toggleSelectAllAttrs}>
          All
        </div>
        { attributeNamesList.map(attr => {
          const attrSelected = frequencies[selectedFrequency].attrs.find(a => a.name === attr) && !allSelected;
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
