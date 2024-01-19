import React, { useRef, useState } from "react";
import classnames from "classnames";
import { useStateContext } from "../hooks/use-state";
import { AttrType, dailyMonthlyAttrMap, hourlyAttrMap } from "../types";
import EditIcon from "../assets/images/icon-edit.svg";

import "./attribute-filter.scss";

export const AttributeFilter = () => {
  const {state} = useStateContext();
  const frequency = state.frequency;
  const units = state.units;
  const attributes = state.attributes;
  const attrMap = frequency === "hourly" ? hourlyAttrMap : dailyMonthlyAttrMap;
  const selectedAttrMap: AttrType[] = [];
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [attributeToFilter, setAttributeToFilter] = useState<AttrType | undefined>(undefined);
  attributes.forEach(attr => {
    const selectedAttr = attrMap.find(a => a.name === attr.name);
    if (selectedAttr) {
      selectedAttrMap.push(selectedAttr);
    }
  });

  const handleFilterClick = (index: number) => {
    setShowFilterModal(true);
    setAttributeToFilter(attributes[index]);
  };

  return (
    <>
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
              const attrFilter = state.filters.find(f => f.attribute === attr.name);
              return (
                <tr key={`${attr}-${idx}-filter`} className="table-body">
                  <td className="filter-attribute">{attr.name}</td>
                  <td className="filter-abbr">{attr.abbr}</td>
                  <td className="filter-units">{attr.unit[units]}</td>
                  <td className={classnames("filter-filter", {"filtering": showFilterModal})}>
                    <div onClick={()=>handleFilterClick(idx)}>
                      {showFilterModal ? "--" : attrFilter?.operator || "all"}
                      <EditIcon className="edit-icon" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(attributeToFilter && showFilterModal) &&
          <FilterModal attr={attributeToFilter} setShowFilterModal={setShowFilterModal}/>}
    </>
  );
};

interface IFilterModalProps {
  attr: AttrType;
  setShowFilterModal: (show: boolean) => void
}

const FilterModal = ({attr, setShowFilterModal}: IFilterModalProps) => {
  const {state, setState} = useStateContext();
  const units = state.units;
  const currentAttr = state.attributes.find(a => a.name === attr.name);
  const currentAttrFilter = state.filters.find(f => f.attribute === attr.name);
  const noValueFilter = currentAttrFilter?.operator === "aboveMean" || currentAttrFilter?.operator === "belowMean";
  const currentFilterValue: number | number[] = (currentAttrFilter && !noValueFilter)
      ? currentAttrFilter?.operator === "between"
        ? [currentAttrFilter.lowerValue, currentAttrFilter.upperValue]
        : currentAttrFilter.value
      : 0;
  const [operator, setOperator] = useState(currentAttrFilter?.operator || "equals");
  const filterValueInputElRef = useRef<HTMLInputElement>(null);
  const filterLowerValueInputElRef = useRef<HTMLInputElement>(null);
  const filterUpperValueInputElRef = useRef<HTMLInputElement>(null);

  console.log("in FilterModal");
  const handleReset = () => {
    setOperator(currentAttrFilter?.operator || "equals");
    setShowFilterModal(false);
  };

  const handleSubmitFilter = () => {
    switch (operator) {
      case "between":
        if (filterLowerValueInputElRef.current && filterUpperValueInputElRef.current) {
          const lowerInputValue = parseFloat(filterLowerValueInputElRef.current.value);
          const upperInputValue = parseFloat(filterUpperValueInputElRef.current.value);
          setState(draft => {
            draft.filters.push({attribute: attr.name, operator, lowerValue: lowerInputValue, upperValue: upperInputValue});
          });
        }
        break;
      case "aboveMean":
      case "belowMean":
        setState(draft => {
          draft.filters.push({attribute: attr.name, operator});
        });
        break;
      default:
        if (filterValueInputElRef.current) {
          const inputValue = parseFloat(filterValueInputElRef.current.value);
          setState(draft => {
            draft.filters.push({attribute: attr.name, operator, value: inputValue});
          });
        }
    }
    setShowFilterModal(false);
  };

  const renderFilterInputs = () => {
    if (currentAttrFilter?.operator === "between") {
      return (
        <div className="between-inputs-wrapper">
          <input className="filter-value between-low-value"></input>
           to
          <input className="filter-value between-upper-value"></input>
        </div>
      );
    } else {
      return <input ref={filterValueInputElRef} className="filter-value" defaultValue={`${currentFilterValue} ${currentAttr?.unit[units]}`}></input>;
    }
  };

  return (
    <div className="filter-modal">
      <div className="filter-wrapper">
        <div className="filter-operator-wrapper">
          <div className="filter-operator">{currentAttrFilter?.operator ?? "equals"}</div>
          <EditIcon />
        </div>
        {!noValueFilter && renderFilterInputs() }
      </div>
      <div className="filter-modal-footer">
        <button className="filter-button reset" onClick={handleReset}>Reset</button>
        <button className="filter-button done" onClick={handleSubmitFilter}>Done</button>
      </div>
    </div>
  );
};
