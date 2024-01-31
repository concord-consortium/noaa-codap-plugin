import { IPlace } from "../types";

const kGeonamesService = "https://secure.geonames.org/search";
const kGeolocService = "https://secure.geonames.org/findNearbyPlaceNameJSON";
// const kMinQueryInterval = 800;
const kDefaultMaxRows = 4;
const kGeonamesUser = "codap";


export const geoNameSearch = async (searchString: string, maxRows?: number): Promise<IPlace[] | undefined> =>{
  const userClause = `username=${kGeonamesUser}`;
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
      return data.geonames.map(function (place: any) {
        return {
          name: `${place.name}, ${place.adminCode1}`,
          latitude: place.lat,
          longitude: place.lng
        };
      });
    }
  }
};

export const autoComplete = async(inputEl: HTMLInputElement) => {
  let thisQuery = inputEl.value;
  try {
    let placeList = await geoNameSearch(thisQuery);
    placeList = placeList || [];
    return placeList;
  } catch {
    console.error(`Could not fetch locations`);
  }
};

// Finds a geo name from lat/long
export const geoLocSearch = async (lat: number, long: number) => {
  const userClause = `username=${kGeonamesUser}`;
  const locClause = `lat=${lat}&lng=${long}`;
  //const filterClause = `cities=cities15000`; // filter cities with population less than 15000. Temporarily commented out to try
  const url = `${kGeolocService}?${[locClause, userClause].join("&")}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return `${data?.geonames?.[0]?.name}, ${data?.geonames?.[0]?.adminCode1}` || "Unknown Location";
    } else {
      return Promise.reject(response.statusText);
    }
  } catch (error) {
    return Promise.reject(error);
  }
};
