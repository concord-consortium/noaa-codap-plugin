import React from "react";
import { useStateContext } from "../hooks/use-state";
import { AttrType, dailyMonthlyAttrMap, hourlyAttrMap } from "../types";
import EditIcon from "../assets/images/icon-edit.svg";

import "./attribute-filter.scss";

export const AttributeFilter = () => {
  const {state} = useStateContext();
  const {frequency, units, attributes} = state;
  const attrMap = frequency === "hourly" ? hourlyAttrMap : dailyMonthlyAttrMap;
  const selectedAttrMap: AttrType[] = [];
  attributes.forEach(attr => {
    const selectedAttr = attrMap.find(a => a.name === attr);
    if (selectedAttr) {
      selectedAttrMap.push(selectedAttr);
    }
  });

  const handleFilterClick = (index: number) => {
    console.log("in handleFilterClick index", index);
  };

  return (
    <div className="attribute-filter-container">
      <table>
        <thead>
          <tr>
            <th scope="col" className="table-header attribute-header">Attributes</th>
            <th scope="col" className="table-header abbr-header">abbr</th>
            <th scope="col" className="table-header units-header">units</th>
            <th scope="col" className="table-header filter-header">filter</th>
          </tr>
        </thead>
        <tbody>
          {selectedAttrMap.map((attr: AttrType, idx: number) => {
            return (
              <tr key={`${attr}-${idx}-filter`} className="table-body">
                <td className="filter-attribute">{attr.name}</td>
                <td className="filter-abbr">{attr.abbr}</td>
                <td className="filter-units">{attr.unit[units]}</td>
                <td className="filter-filter">
                  <div onClick={()=>handleFilterClick(idx)}>
                    all
                    <EditIcon className="edit-icon" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
