import React, { useEffect, useMemo, useRef, useState } from "react";
import classnames from "classnames";
import { useStateContext } from "../hooks/use-state";
import {
  AttrType,
  IBetweenFilter,
  IBottomFilter,
  ISingleValueFilter,
  ITopFilter,
  TOperators,
  operatorSymbolMap,
  operatorTextMap,
  dailyMonthlyAttrMap,
  hourlyAttrMap
} from "../types";
import EditIcon from "../assets/images/icon-edit.svg";

import "./attribute-filter.scss";

export const AttributeFilter = () => {
  const {state, setState} = useStateContext();
  const {selectedFrequency, units, frequencies} = state;
  const attrMap = selectedFrequency === "hourly" ? hourlyAttrMap : dailyMonthlyAttrMap;
  const [hasFilter, setHasFilter] = useState(false);
  const [filteringIndex, setFilteringIndex] = useState<number | undefined>(undefined);
  const [targetFilterBottom, setTargetFilterBottom] = useState(0);
  const [filterModalPosition, setFilterModalPosition] = useState({ top: 0 });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [attributeToFilter, setAttributeToFilter] = useState<AttrType | undefined>(undefined);
  const selectedAttrMap = useMemo(() => {
    const result: AttrType[] = [];
    frequencies[selectedFrequency].attrs.forEach(attr => {
      const selectedAttr = attrMap.find(a => a.name === attr.name);
      if (selectedAttr) {
        result.push(selectedAttr);
      }
    });
    return result;
  }, [attrMap, frequencies, selectedFrequency]);

  useEffect(()=>{
    const hasFilters = selectedAttrMap.some(selectedAttr => {
      const filter = frequencies[selectedFrequency].filters.find(f => f.attribute === selectedAttr.name);
      return filter !== undefined;
    });

    if (hasFilters) {
      setHasFilter(true);
    }
  },[frequencies, selectedAttrMap, selectedFrequency]);

  const handleFilterClick = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.bottom + window.scrollY;

    setTargetFilterBottom(rect.bottom);
    setFilterModalPosition({top});
    setShowFilterModal(true);
    setAttributeToFilter(frequencies[selectedFrequency].attrs[index]);
    setFilteringIndex(index);
  };

  const handleUnitsToggle = () => {
    setState(draft => {
      draft.units = draft.units === "standard" ? "metric" : "standard";
    });
  };

  if (selectedAttrMap && selectedAttrMap.length > 0) {
    return (
      <div className="attribute-filter-container">
        <table>
          <thead>
            <tr>
              <th scope="col" className={classnames("table-header attribute-header", {"narrow": hasFilter})}>Attributes</th>
              <th scope="col" className="table-header abbr-header">abbr</th>
              <th scope="col" className="table-header units-header"  onClick={handleUnitsToggle}>units</th>
              <th scope="col" className={classnames("table-header filter-header", {"wide": hasFilter})}>filter</th>
            </tr>
          </thead>
          <tbody>
            {selectedAttrMap.map((attr: AttrType, idx: number) => {
              let filterValue;
              const attrFilter = frequencies[selectedFrequency].filters.find(f => f.attribute === attr.name);
              if (attrFilter) {
                const filterAboveOrBelowMean = (attrFilter.operator === "aboveMean" || attrFilter?.operator === "belowMean");
                filterValue = attributeToFilter === attr && showFilterModal
                  ? "--"
                  : filterAboveOrBelowMean
                      ? `${operatorTextMap[attrFilter.operator]}`
                      : attrFilter.operator === "between"
                          ? `${attrFilter.lowerValue} ${attr.unit[units]} - ${attrFilter.upperValue} ${attr.unit[units]}`
                          : attrFilter.operator === "top" || attrFilter.operator === "bottom"
                            ? `${operatorTextMap[attrFilter.operator]} ${attrFilter.value}`
                            :`${operatorSymbolMap[attrFilter.operator]} ${attrFilter.value} ${attr.unit[units]}`;
              } else {
                filterValue = attributeToFilter === attr && showFilterModal ? "--" : filterValue = "all";
              }

              return (
                <tr key={`${attr}-${idx}-filter`} className="table-row">
                  <td className="filter-attribute">{attr.name}</td>
                  <td className="filter-abbr">{attr.abbr}</td>
                  <td className="filter-units" >{attr.unit[units]}</td>
                  <td className={classnames("filter-filter", {"filtering": idx === filteringIndex && showFilterModal,
                                              "has-filter": !showFilterModal && attrFilter})}
                      onClick={(e)=>handleFilterClick(e,idx)}>
                    <div className="filter-value-container">
                      <span>{filterValue}</span>
                      <EditIcon className="edit-icon" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(attributeToFilter && showFilterModal) &&
              <FilterModal attr={attributeToFilter} setShowFilterModal={setShowFilterModal} position={filterModalPosition}
                            setFilterModalPosition={setFilterModalPosition} targetFilterBottom={targetFilterBottom}
              />}
      </div>
    );
  } else {
    return null;
  }
};

interface IFilterModalProps {
  attr: AttrType;
  position: {top: number};
  targetFilterBottom?: number;
  setShowFilterModal: (show: boolean) => void
  setFilterModalPosition: (position: {top: number}) => void;
}

const FilterModal = ({attr, position, targetFilterBottom, setShowFilterModal, setFilterModalPosition}: IFilterModalProps) => {
  const {state, setState} = useStateContext();
  const {frequencies, units, selectedFrequency} = state;
  const currentAttr = frequencies[selectedFrequency].attrs.find(a => a.name === attr.name);
  const currentAttrFilter = frequencies[selectedFrequency].filters.find(f => f.attribute === attr.name);
  const noValueFilter = currentAttrFilter?.operator === "aboveMean" || currentAttrFilter?.operator === "belowMean";
  const currentFilterValue: number | [number, number] | undefined  =
          (currentAttrFilter && !noValueFilter)
            ? currentAttrFilter?.operator === "between"
              ? [currentAttrFilter.lowerValue || 0, currentAttrFilter.upperValue || 0]
              : currentAttrFilter.value !== undefined ? currentAttrFilter.value : 0
            : 0;
  const [operator, setOperator] = useState<TOperators>(currentAttrFilter?.operator || "equals");
  const [showOperatorSelectionModal, setShowOperatorSelectionModal] = useState(false);
  const filterValueInputElRef = useRef<HTMLInputElement>(null);
  const filterValueTopBottomInputElRef = useRef<HTMLInputElement>(null);
  const filterLowerValueInputElRef = useRef<HTMLInputElement>(null);
  const filterUpperValueInputElRef = useRef<HTMLInputElement>(null);
  const operatorSelectionModalRef = useRef<HTMLDivElement>(null);
  const [operatorSelectionListHeight, setOperatorSelectionListHeight] = useState({height: 190});
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const dropdownRect = operatorSelectionModalRef.current?.getBoundingClientRect();
  const dropdownBottom = dropdownRect?.bottom;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (event.target) {
        if (operatorSelectionModalRef.current && !operatorSelectionModalRef.current.contains(event.target as Node)) {
          setShowOperatorSelectionModal(false);
        }
      }
    }
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move modal to bottom of window if window is too short
  useEffect(() => {
    const modalHeight = 89;
    if (position.top + modalHeight > windowHeight) {
      setFilterModalPosition({top: windowHeight - modalHeight});
    } else {
      setFilterModalPosition({top: targetFilterBottom || 0});
    }
  // Adding the other dependencies causes the modal to jump around
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowHeight]);

  // Change filter-operator-selection-container height if window is shorter than dropdown
  useEffect(() => {
    if (showOperatorSelectionModal) {
      console.log("dropdownBottom && dropdownBottom > windowHeight", dropdownBottom, windowHeight, dropdownBottom && dropdownBottom > windowHeight);
      if (dropdownBottom && dropdownBottom > windowHeight) {
        const cutOffAmount = dropdownBottom - windowHeight;
        setOperatorSelectionListHeight({height: 190 - cutOffAmount - 3});
      } else {
        setOperatorSelectionListHeight({height: 190});
      }
    }
  },[dropdownBottom, showOperatorSelectionModal, windowHeight]);

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
            const existingFilter = draft.frequencies[selectedFrequency].filters.find(f=>f.attribute === attr.name);
            if (existingFilter) {
              (existingFilter as IBetweenFilter).operator = operator;
              (existingFilter as IBetweenFilter).lowerValue = lowerInputValue;
              (existingFilter as IBetweenFilter).upperValue = upperInputValue;
            } else {
              draft.frequencies[selectedFrequency].filters.push({attribute: attr.name, operator, lowerValue: lowerInputValue, upperValue: upperInputValue});
            }
          });
        }
        break;
      case "top":
      case "bottom":
        if (filterValueTopBottomInputElRef.current) {
          const inputValue = parseFloat(filterValueTopBottomInputElRef.current.value);
          setState(draft => {
            const existingFilter = draft.frequencies[selectedFrequency].filters.find(f=>f.attribute === attr.name);
            if (existingFilter) {
              (existingFilter as ITopFilter | IBottomFilter).operator = operator;
              (existingFilter as ITopFilter | IBottomFilter).value = inputValue;
            } else {
              draft.frequencies[selectedFrequency].filters.push({attribute: attr.name, operator, value: inputValue});
            }
          });
        }
        break;
      case "aboveMean":
      case "belowMean":
        setState(draft => {
          const existingFilter = draft.frequencies[selectedFrequency].filters.find(f=>f.attribute === attr.name);
          if (existingFilter) {
            existingFilter.operator = operator;
          } else {
            draft.frequencies[selectedFrequency].filters.push({attribute: attr.name, operator});
          }
        });
        break;
      default:
        if (filterValueInputElRef.current) {
          const inputValue = parseFloat(filterValueInputElRef.current.value);
          setState(draft => {
            const existingFilter = draft.frequencies[selectedFrequency].filters.find(f=>f.attribute === attr.name);
            if (existingFilter) {
              (existingFilter as ISingleValueFilter).operator = operator;
              (existingFilter as ISingleValueFilter).value = inputValue;
            } else {
              draft.frequencies[selectedFrequency].filters.push({attribute: attr.name, operator, value: inputValue});
            }
          });
        }
    }
    setShowFilterModal(false);
  };

  const renderFilterInputs = () => {
    const [lowerVal, upperVal] = Array.isArray(currentFilterValue) ? currentFilterValue : [0, 0];
    // key attribute forces inputs to rerender when operator changes
    if (operator === "between") {
      return (
        <div className="between-inputs-wrapper" key={`${operator}-${units}`}>
          <input ref={filterLowerValueInputElRef} className="filter-value between-low-value"
            defaultValue={`${lowerVal} ${currentAttr?.unit[units]}`}>
          </input>
          <span>and</span>
          <input ref={filterUpperValueInputElRef} className="filter-value between-upper-value"
            defaultValue={`${upperVal} ${currentAttr?.unit[units]}`}>
          </input>
        </div>
      );
    } else if (operator === "aboveMean" || operator === "belowMean") {
      return null;
    } else if (operator === "top" || operator === "bottom") {
      return <input ref={filterValueTopBottomInputElRef} key={`${operator}-${units}`} className="filter-value" defaultValue={`${currentFilterValue || "100"}`}></input>;
    } else {
      return <input ref={filterValueInputElRef} key={`${operator}-${units}`} className="filter-value" defaultValue={`${currentFilterValue} ${currentAttr?.unit[units]}`}></input>;
    }
  };

  const handleChangeFilterOperator = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowOperatorSelectionModal(true);
  };

  const handleSelectFilterOperator = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.currentTarget.value as TOperators;
    e.stopPropagation();
    setOperator(newOperator);
    setShowOperatorSelectionModal(false);
  };

  const wideModal = !["equals", "top", "bottom"].includes(operator);

  return (
    <div className={classnames("filter-modal", {"wide": wideModal})} style={position}>
      <div className="filter-wrapper">
        <div className="filter-operator-wrapper" onClick={handleChangeFilterOperator}>
          <div className="filter-operator">
            {operatorTextMap[operator] || "equals"}
          </div>
          <EditIcon />
        </div>
        {renderFilterInputs()}
        {(operator === "top" || operator === "bottom") && <span>{` results`}</span>}
      </div>
      <div className="filter-modal-footer">
        <button className="filter-button reset" onClick={handleReset}>Reset</button>
        <button className="filter-button done" onClick={handleSubmitFilter}>Done</button>
      </div>
      {showOperatorSelectionModal &&
        <div ref={operatorSelectionModalRef} className="filter-operator-selection-container" style={operatorSelectionListHeight}>
          <select className="operator-selection" size={11} onChange={handleSelectFilterOperator}>
            <option value="equals">{operatorTextMap.equals} ...</option>
            <option value="doesNotEqual">{operatorTextMap.doesNotEqual} ...</option>
            <option value="greaterThan">{operatorTextMap.greaterThan} ...</option>
            <option value="greaterThanOrEqualTo">{operatorTextMap.greaterThanOrEqualTo} ...</option>
            <option value="lessThan">{operatorTextMap.lessThan} ...</option>
            <option value="lessThanOrEqualTo">{operatorTextMap.lessThanOrEqualTo} ...</option>
            <option value="between">{operatorTextMap.between} ...</option>
            <option value="top">{operatorTextMap.top} ...</option>
            <option value="bottom">{operatorTextMap.bottom} ...</option>
            <option value="aboveMean">{operatorTextMap.aboveMean}</option>
            <option value="belowMean">{operatorTextMap.belowMean}</option>
          </select>
        </div>
      }
    </div>
  );
};
