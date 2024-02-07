import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { useStateContext } from "../hooks/use-state";
import { dailyMonthlyAttrMap, hourlyAttrMap } from "../types";
import { dataTypeStore } from "../utils/noaaDataTypes";

import "./attribute-selector.scss";

export const AttributesSelector = () => {
  const {state, setState} = useStateContext();
  const {units, frequencies, selectedFrequency} = state;
  const [allSelected, setAllSelected] = useState(true);
  const hourlyAttributeNames = hourlyAttrMap.map(attr => { return attr.name; });
  const dailyMonthlyAttributeNames = dailyMonthlyAttrMap.map(attr => { return attr.name; });
  const attributeList = selectedFrequency === "hourly" ? hourlyAttrMap : dailyMonthlyAttrMap;
  const attributeNamesList = selectedFrequency === "hourly" ? hourlyAttributeNames : dailyMonthlyAttributeNames;
  const selectedAttrsAndFiltersForFrequency = frequencies[selectedFrequency];

  useEffect(() => {
    if (frequencies[selectedFrequency].attrs.length === attributeList.length) {
      setAllSelected(true);
    } else {
      setAllSelected(false);
    }
  }, [attributeList.length, frequencies, selectedFrequency]);

  const handleUnitsClicked = () => {
    const newUnits = units === "standard" ? "metric" : "standard";
    const newSelectedAttrFilters = frequencies[selectedFrequency].filters.map((filter) => {
      const { attribute, operator } = filter;
      const dataType = dataTypeStore.findByName(attribute);
      if (dataType && dataType.convertUnits) {
        const fromUnits = dataType.units[units];
        const toUnits = dataType.units[newUnits];
        if (operator === "between") {
          const lowerValue = parseFloat((dataType.convertUnits(fromUnits, toUnits, filter.lowerValue.toString())).toFixed(1));
          const upperValue = parseFloat((dataType.convertUnits(fromUnits, toUnits, filter.upperValue.toString())).toFixed(1));
          return {
            ...filter,
            lowerValue,
            upperValue
          };
        } else if (operator !== "top" && operator !== "bottom" && operator !== "aboveMean" && operator !== "belowMean" && operator !== "all") {
          const value = parseFloat((dataType.convertUnits(fromUnits, toUnits, filter.value.toString())).toFixed(1));
          return {
            ...filter,
            value
          };
        }
      }
      return filter;
    });
    setState(draft => {
      draft.units = draft.units === "standard" ? "metric" : "standard";
      draft.frequencies[selectedFrequency].filters = newSelectedAttrFilters;
    });
  };

  const toggleSelectAllAttrs = () => {
    const filters = selectedAttrsAndFiltersForFrequency.filters;
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
    const filters = selectedAttrsAndFiltersForFrequency.filters;
    setState(draft => {
      const draftAttrNames = draft.frequencies[selectedFrequency].attrs.map(a => {return a.name;});
      if (allSelected) {
        setAllSelected(false);
        draft.frequencies[selectedFrequency] = {attrs: [], filters};
        selectedAttr !== undefined && draft.frequencies[selectedFrequency].attrs.push(selectedAttr);
      } else if (selectedAttrName) {
        if (selectedAttr !== undefined) {
          if (draftAttrNames.includes(selectedAttrName)) {
            const attrIndex = draftAttrNames.indexOf(selectedAttrName);
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
        <span className="attributes-title" title="Choose attributes of weather data to fetch">Attributes</span>
        <div className="units-selection" title="Select unit system for fetched data: standard or metric">
          <label className="units-label">Units</label>
          <button className={classnames("units-switch left", {"selected-unit": units === "standard"})} onClick={handleUnitsClicked}>standard</button>
          <button className={classnames("units-switch right",{"selected-unit": units === "metric"} )} onClick={handleUnitsClicked}>metric</button>
        </div>
      </div>
      <div className="attribute-selection">
        <div className={`attribute-button all ${allSelected ? "selected" : ""}`} onClick={toggleSelectAllAttrs} title="Select all attributes">
          All
        </div>
        { attributeNamesList.map(attr => {
          const attrSelected = frequencies[selectedFrequency].attrs.find(a => a.name === attr);
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
