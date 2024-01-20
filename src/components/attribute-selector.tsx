import React, { useState } from "react";
import { useStateContext } from "../hooks/use-state";
import ToggleIcon from "../assets/images/icon-toggle.svg";

import "./attribute-selector.scss";
import { dailyMonthlyAttrMap, hourlyAttrMap } from "../types";

export const AttributesSelector = () => {
  const {state, setState} = useStateContext();
  const {units, attributes} = state;
  const [allSelected, setAllSelected] = useState(false);
  const hourlyAttributeNames = hourlyAttrMap.map(attr => { return attr.name; });
  const dailyMonthlyAttributeNames = dailyMonthlyAttrMap.map(attr => { return attr.name; });
  const attributeList = state.frequency === "hourly" ? hourlyAttrMap : dailyMonthlyAttrMap;
  const attributeNamesList = state.frequency === "hourly" ? hourlyAttributeNames : dailyMonthlyAttributeNames;

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
        draft.attributes = state.frequency === "hourly" ? hourlyAttrMap : dailyMonthlyAttrMap;
      });
    }
  };

  const toggleAttributeSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    const selectedAttrName = e.currentTarget.textContent;
    const selectedAttr = attributeList.find(a => a.name === selectedAttrName);
    setState(draft => {
      const draftAttrNames = draft.attributes.map(attr => {return attr.name;});
      if (allSelected) {
        setAllSelected(false);
        draft.attributes = [];
        selectedAttr && draft.attributes.push(selectedAttr);
      }
      if (selectedAttrName) {
        const attrIndex = draftAttrNames.indexOf(selectedAttrName);
        if (selectedAttr) {
          if (draftAttrNames.includes(selectedAttrName)) {
            if (attrIndex !== null) {
              draft.attributes.splice(attrIndex, 1);
            }
          } else {
            draft.attributes.push(selectedAttr);
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
          const attrSelected = attributes.find(a => a.name === attr) && !allSelected;
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
