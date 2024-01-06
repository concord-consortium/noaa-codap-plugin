import React, { useRef } from "react";

const kGeonamesService = "https://secure.geonames.org/search";
const kGeolocService = "https://secure.geonames.org/findNearbyPlaceNameJSON";
const kMinQueryInterval = 800;
const kDefaultMaxRows = 5;
const kMinNameLength = 3;
const kPlaceholderText = "city, state";

const kClassGeoNameInput = "geo-name-select";
const kClassSelectList = "geoname-selection-list";
const kClassSelectOption = "geoname-selector-option";
const kClassHidden = "geoname-hidden";
const kClassCandidate = "geoname-candidate";

interface IPlace {
  name: string;
  latitude: number;
  longitude: number;
}

interface GeonameSearchProps {
  geonamesUser: string;
  selectionHandler: (selectedPlace: IPlace | null) => void;
}

const GeonameSearch: React.FC<GeonameSearchProps> = ({ geonamesUser, selectionHandler }) => {
  const inputEl = useRef<HTMLInputElement>(null);
  const selectionListEl = useRef<HTMLDivElement>(null);
  let placeList: IPlace[] = [];
  let selectedPlace: IPlace | null = null;
  let queryInProgress = false;
  let timer: NodeJS.Timeout | null = null;

  async function geoNameSearch(searchString: string, maxRows?: number): Promise<IPlace[] | undefined> {
    const userClause = `username=${geonamesUser}`;
    const countryClause = "country=US";
    const maxRowsClause = `maxRows=${maxRows || kDefaultMaxRows}`;
    // const featureClassClause = "featureClass=P"; // populated places
    // const orderByClause = "orderby=relevance"
    const languageClause = "lang=en";
    const typeClause = "type=json";
    const nameRequiredClause = "isNameRequired=true";

    // let nameClause = `q=${searchString}`;
    let nameClause = `name_startsWith=${searchString}`;
    let url = `${kGeonamesService}?${[userClause, countryClause, maxRowsClause, /*orderByClause, *//*featureClassClause, */languageClause, typeClause, nameRequiredClause, nameClause].join(
        "&")}`;
    let response = await fetch(url);
    if (response.ok) {
      let data = await response.json();
      if (data.totalResultsCount > 0) {
        console.log(JSON.stringify(data));
        return data.geonames.map(function (place: any) {
          return {
            name: `${place.name}, ${place.adminCode1}`,
            latitude: place.lat,
            longitude: place.lng
          };
        });
      }
    }
  }

  async function geoLocSearch(lat: number, long: number) {
    const userClause = `username=${geonamesUser}`;
    const locClause = `lat=${lat}&lon=${long}`;
    const url = `${kGeolocService}?${[locClause,userClause].join("&")}`;
    return fetch(url).then((rslt) => {
      if (rslt.ok) {
        return rslt.json();
      } else {
        return Promise.reject(rslt.statusText);
      }
    });  }

  function populateGeoNameSelector(containerEl: Element, placeList: IPlace[]) {
    if (!placeList || !placeList.length) {
      return;
    }
    let optionEls = containerEl.querySelectorAll("." + kClassSelectOption);
    containerEl.classList.remove(kClassHidden);
    let optionEl;
    optionEls.forEach(function (el) {
      el.classList.add(kClassHidden);
    });
    placeList.forEach(function (place, ix) {
      if (optionEls && optionEls[ix]) {
        optionEl = optionEls[ix];
        optionEl.classList.remove(kClassHidden);
        optionEl.classList.remove(kClassCandidate);
      } else {
        optionEl = document.createElement("div");
        optionEl.classList.add(kClassSelectOption);
        containerEl.append(optionEl);
      }
      optionEl.innerText = place.name;
      optionEl.setAttribute("dataix", String(ix));
      if (ix === 0) {
        optionEl.classList.add(kClassCandidate);
      }
    });  }



  // Other functions (handleTimeout, handleKeyDown, handlePlaceNameSelection, handleHover) go here...
  function handleKeyDown(ev) {
    let selectorHidden = selectionListEl.classList.contains(kClassHidden);
    let option = selectionListEl.querySelector("." + kClassCandidate);
    if (ev.key === "Enter") {
      if (selectorHidden) {
        autoComplete();
        ev.stopPropagation();
      } else {
        if (option) {
          inputEl.value = option.innerText;
          selectedPlace = placeList[Number(option.attributes.dataix.value)];
          selectionHandler(selectedPlace);
          selectionListEl.classList.add(kClassHidden);
        }
      }
    } else if (ev.key === "ArrowDown") {
      if (!selectorHidden) {
        let currentCandidateEl = selectionListEl.current?.querySelector("." + kClassCandidate );
        let currentIx = currentCandidateEl && currentCandidateEl.getAttribute("dataix");
        let nextIx = (currentIx != null) && Math.min(Number(currentIx) + 1, kDefaultMaxRows);
        if (nextIx && Number(currentIx) !== nextIx) {
          let optionEls = selectionListEl.current?.querySelectorAll(`.${kClassSelectOption}`);
          let nextEl = optionEls && optionEls[nextIx];
          if ((nextEl != null)
              && (nextEl !== currentCandidateEl)
              && !nextEl.classList.contains(kClassHidden)) {
            currentCandidateEl && currentCandidateEl.classList.remove(kClassCandidate);
            nextEl.classList.add(kClassCandidate);
            ev.stopPropagation();
            ev.preventDefault();
          }
        }
      }
    } else if (ev.key === "ArrowUp") {
      if (!selectorHidden) {
        let currentCandidateEl = selectionListEl.current?.querySelector("." + kClassCandidate );
        let currentIx = currentCandidateEl && currentCandidateEl.getAttribute("dataix");
        let nextIx = (currentIx != null) && Math.max(Number(currentIx) - 1, 0);
        if ((nextIx != null) && Number(currentIx) !== nextIx) {
          let optionEls = selectionListEl.current?.querySelectorAll(`.${kClassSelectOption}`);
          let nextEl = optionEls && optionEls[nextIx];
          if ((nextEl != null)
              && (nextEl !== currentCandidateEl)
              && !nextEl.classList.contains(kClassHidden)) {
            currentCandidateEl && currentCandidateEl.classList.remove(kClassCandidate);
            nextEl.classList.add(kClassCandidate);
            ev.stopPropagation();
            ev.preventDefault();
          }
        }
      }
    } else {
      // let value = value;
      selectedPlace = null;
      if (value.length >= kMinNameLength) {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(handleTimeout, kMinQueryInterval);
      }
    }
  }

  function handlePlaceNameSelection(ev) {
    let target = ev.target;
    if (target.classList.contains(kClassSelectOption)) {
      inputEl.value = target.innerText;
      selectedPlace = placeList[Number(target.attributes.dataix.value)];
      selectionHandler(selectedPlace);
    }
    classList.add(kClassHidden);
  }

  function handleHover(ev) {
    let target = ev.target;
    if (target.classList.contains(kClassSelectOption)) {
      selectionListEl.current?.querySelectorAll("." + kClassCandidate).forEach(function (el) {
        el.classList.remove(kClassCandidate);
      });
      target.classList.add(kClassCandidate);
      ev.stopPropagation();
    }
  }

  return (
    <>
      <input
        ref={inputEl}
        className={kClassGeoNameInput}
        type="text"
        placeholder={kPlaceholderText}
        onKeyDown={handleKeyDown}
      />
      <div
        ref={selectionListEl}
        className={`${kClassSelectList} ${kClassHidden}`}
        onMouseOver={handleHover}
        onClick={handlePlaceNameSelection}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      />
    </>
  );
};

export default GeonameSearch;

async function geoNameSearch(searchString: string, maxRows?: number): Promise<IPlace[] | undefined> {
  const userClause = `username=${geonamesUser}`;
  const countryClause = "country=US";
  const maxRowsClause = `maxRows=${maxRows || kDefaultMaxRows}`;
  // const featureClassClause = "featureClass=P"; // populated places
  // const orderByClause = "orderby=relevance"
  const languageClause = "lang=en";
  const typeClause = "type=json";
  const nameRequiredClause = "isNameRequired=true";

  // let nameClause = `q=${searchString}`;
  let nameClause = `name_startsWith=${searchString}`;
  let url = `${kGeonamesService}?${[userClause, countryClause, maxRowsClause, /*orderByClause, *//*featureClassClause, */languageClause, typeClause, nameRequiredClause, nameClause].join(
      "&")}`;
  let response = await fetch(url);
  if (response.ok) {
    let data = await response.json();
    if (data.totalResultsCount > 0) {
      console.log(JSON.stringify(data));
      return data.geonames.map(function (place: any) {
        return {
          name: `${place.name}, ${place.adminCode1}`,
          latitude: place.lat,
          longitude: place.lng
        };
      });
    }
  }
}

export const autoComplete = async(inputEl: HTMLInputElement, locationDivEl: HTMLDivElement) => {
  let thisQuery = inputEl.value;
  let queryInProgress = false;
  try {
    queryInProgress = true;
    let placeList = await geoNameSearch(thisQuery);
    placeList = placeList || [];
    populateGeoNameSelector(selectionListEl, placeList);
  } finally {
    queryInProgress = false;
  }
}
