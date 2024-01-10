
const kGeonamesService = "https://secure.geonames.org/search";
// const kGeolocService = "https://secure.geonames.org/findNearbyPlaceNameJSON";
// const kMinQueryInterval = 800;
const kDefaultMaxRows = 4;
const kGeonamesUser = "codap";

export interface IPlace {
  name: string;
  lat: number;
  long: number;
}

async function geoNameSearch(searchString: string, maxRows?: number): Promise<IPlace[] | undefined> {
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

export const autoComplete = async(inputEl: HTMLInputElement) => {
  let thisQuery = inputEl.value;
  console.log("in autoComplete");
  try {
    let placeList = await geoNameSearch(thisQuery);
    placeList = placeList || [];
    console.log("placeList", placeList);
    return placeList;
  } catch {
    console.error(`Could not fetch locations`);
  }
};

export const getGeolocation: Record<string, any> = async() => {
  return new Promise(function (resolve, reject) {
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        resolve(pos.coords);
      }, function (err) {
        console.warn(
            `Weather Plugin.getGeolocation failed: ${err.code}, ${err.message}`);
        reject(err.message);
      });
    } else {
      reject("The GeoLocation API is not supported on this browser");
    }
  });
};
