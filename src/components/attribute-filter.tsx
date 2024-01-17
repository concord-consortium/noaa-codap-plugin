import React from "react";
import { useStateContext } from "../hooks/use-state";
import EditIcon from "../assets/images/icon-edit.svg";

import "./attribute-filter.scss";

export const AttributeFilter = () => {
  const {state, setState} = useStateContext();
  const attributes = state.attributes;
  return (
    <div className="attribute-filter-container">
      <div className="table-header attribute-header">Attributes</div>
      <div className="table-header abbr-header">abbr</div>
      <div className="table-header units-header">units</div>
      <div className="table-header filter-header">filter</div>
      <div className="table-body">
        {attributes.map((attr: string) => {
          return(
            <>
              <div key={`${attr}-filter`} className="filter-attribute">{attr}</div>
              <div className="filter-abbr"></div>
              <div className="filter-units"></div>
              <div className="filter-filter">
                all
                <EditIcon className="edit-icon" />
              </div>
            </>

          );
        })}
      </div>
    </div>
  );
};
