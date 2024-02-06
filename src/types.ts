export type IFrequency = "hourly" | "daily" | "monthly";
export type IUnits = "standard" | "metric";

export interface AttrType {
  name: string;
  abbr: string;
  unit: {metric: string, standard: string}
}

export type TOperators = "equals" | "doesNotEqual" | "greaterThan" | "greaterThanOrEqualTo" | "lessThan"
                            | "lessThanOrEqualTo" | "between" | "top" | "bottom" | "aboveMean" | "belowMean" | "all";

export const operatorTextMap = {equals: "equals", doesNotEqual: "does not equal", greaterThan: "is greater than", greaterThanOrEqualTo: "is greater than or equal to",
lessThan: "is less than", lessThanOrEqualTo: "is less than or equal to", between: "between", top: "top", bottom: "bottom",
aboveMean: "above mean", belowMean: "below mean", all: "all"};
export const operatorSymbolMap = {equals: "=", doesNotEqual: "≠", greaterThan: ">", greaterThanOrEqualTo: ">=", lessThan: "<", lessThanOrEqualTo: "<="};

export interface IBaseFilter {
  attribute: string;
}
export interface IEqualsFilter extends IBaseFilter {
  operator: "equals",
  value: number
}
export interface IDoesNotEqualFilter extends IBaseFilter {
  operator: "doesNotEqual",
  value: number
}
export interface IGreaterThanFilter extends IBaseFilter {
  operator: "greaterThan",
  value: number
}
export interface IGreaterThanOrEqualToFilter extends IBaseFilter {
  operator: "greaterThanOrEqualTo",
  value: number
}
export interface ILessThanFilter extends IBaseFilter {
  operator: "lessThan",
  value: number
}
export interface ILessThanOrEqualToFilter extends IBaseFilter {
  operator: "lessThanOrEqualTo",
  value: number
}
export interface IBetweenFilter extends IBaseFilter {
  operator: "between",
  lowerValue: number,
  upperValue: number
}
export interface ITopFilter extends IBaseFilter {
  operator: "top",
  value: number
}
export interface IBottomFilter extends IBaseFilter {
  operator: "bottom",
  value: number
}
export interface IAboveMeanFilter extends IBaseFilter {
  operator: "aboveMean",
}
export interface IBelowMeanFilter extends IBaseFilter {
  operator: "belowMean",
}
export interface IAllFilter extends IBaseFilter {
  operator: "all",
}
export type ISingleValueFilter =IEqualsFilter | IDoesNotEqualFilter | IGreaterThanFilter | IGreaterThanOrEqualToFilter | ILessThanFilter | ILessThanOrEqualToFilter | ITopFilter | IBottomFilter;
export type IFilter = IEqualsFilter | IDoesNotEqualFilter | IGreaterThanFilter | IGreaterThanOrEqualToFilter | ILessThanFilter | ILessThanOrEqualToFilter | IBetweenFilter | ITopFilter | IBottomFilter | IAboveMeanFilter | IBelowMeanFilter | IAllFilter;

export interface IPlace {
  name: string;
  latitude: number;
  longitude: number;
}
export interface IStation {station: IWeatherStation, distance: number}
export interface IWeatherStation {
  country: string; // "US"
  state: string; // 2 char state name
  latitude: number;
  longitude: number;
  name: string;
  elevation: number;
  ICAO: string; // "KMWN"
  mindate: string; // "1973-01-01"
  maxdate: string; // "1973-01-01" || "present",
  isdID: string; // "72613014755,72613099999",
  ghcndID: string; // "USW00014755"
  ranges: IWeatherStationRange[];
}

interface IWeatherStationRange {
  mindate: string;
  maxdate: string;
  latitude: number;
  longitude: number;
  name: string;
  elevation: string;
  ids: IWeatherStationID[];
}

interface IWeatherStationID {
  type: string;
  id: string;
}

export interface ITimeZone {
  gmtOffset: string;
  name: string;
}

export interface IState {
  location?: IPlace;
  weatherStation?: IWeatherStation;
  weatherStationDistance?: number;
  selectedFrequency: IFrequency;
  frequencies: {
    [key in IFrequency]: {attrs: AttrType[], filters: IFilter[]};
  };
  startDate?: Date;
  endDate?: Date;
  units: IUnits;
  showModal?: "info" | "data-return-warning";
  timezone?: ITimeZone;
  didUserSelectDate: boolean;
  isMapOpen: boolean;
  zoomMap: boolean;
  didUserSelectStationFromMap?: boolean;
}

export const unitMap: UnitMap = {
  angle: { metric: "º", standard: "º" },
  distance: { metric: "m", standard: "yd" },
  precipitation: { metric: "mm", standard: "in" },
  pressure: { metric: "hPa", standard: "hPa" },
  speed: { metric: "m/s", standard: "mph" },
  temperature: { metric: "°C", standard: "°F" },
};


export const dailyMonthlyAttrMap: AttrType[] = [
  {name: "Maximum temperature", abbr: "tMax", unit: unitMap.temperature},
  {name: "Minimum temperature", abbr: "tMin", unit: unitMap.temperature},
  {name: "Average temperature", abbr: "tAvg", unit: unitMap.temperature},
  {name: "Precipitation", abbr: "precip", unit: unitMap.precipitation},
  {name: "Snowfall", abbr: "snow", unit: unitMap.precipitation},
  {name: "Average wind speed", abbr: "avgWind", unit: unitMap.speed}
];

export const hourlyAttrMap: AttrType[] = [
  {name: "Dew Point", abbr: "Dew", unit: unitMap.temperature},
  {name: "Visibility", abbr: "Vis", unit: unitMap.distance},
  {name: "Barometric Pressure at sea level", abbr: "Pressure", unit: unitMap.pressure},
  {name: "Air temperature", abbr: "Temp", unit: unitMap.temperature},
  {name: "Wind direction", abbr: "WDir", unit: unitMap.angle},
  {name: "Wind speed", abbr: "WSpeed", unit: unitMap.speed},
  {name: "Precipitation in last hour", abbr: "Precip", unit: unitMap.precipitation}
];


export const DefaultState: IState = {
  selectedFrequency: "daily",
  frequencies: {hourly: {attrs: hourlyAttrMap, filters: []},
                daily: {attrs: dailyMonthlyAttrMap, filters: []},
                monthly: {attrs: dailyMonthlyAttrMap, filters: []}},
  units: "standard",
  didUserSelectDate: false,
  isMapOpen: false,
  zoomMap: false,
};

interface IDataTypeUnits {
  ["standard"]: string;
  ["metric"]: string;
}
export interface IDataType {
  name: string;
  units: IDataTypeUnits;
  description: string;
}

export interface Attribute {
  name: string;
  formula?: string;
  description?: string;
  type?: string;
  cid?: string;
  precision?: string;
  unit?: string;
  editable?: boolean;
  renameable?: boolean;
  deleteable?: boolean;
  hidden?: boolean;
}

export interface Collection {
  name: string;
  title: string;
  id?: number;
  parent?: string | number;
  description?: string;
  labels?: {
    singleCase?: string;
    pluralCase?: string;
    singleCaseWithArticle?: string;
    setOfCases?: string;
    setOfCasesWithArticle?: string;
  };
  attrs: Attribute[];
}

export interface DataContextCreation {
  title: string;
  collections?: Collection[];
}

export interface DataContext extends DataContextCreation {
  name: string;
  collections: Collection[];
}

export interface CodapItemValues {
  [attr: string]: any;
}

export interface CodapItem {
  id: number|string;
  values: CodapItemValues;
}

export type Action = "create" | "get" | "update" | "delete";

export type ILatLong = [number, number];

export interface IMapComponent {
  type: "map",
  name: string,
  title?: string,
  dimensions: {
    width: number,
    height: number
  },
  position: string,
  cannotClose: boolean,
  dataContext: string,
  legendAttributeName?: string,
  center: ILatLong,
  zoom: number
}

export type Unit = "m" | "mm" | "in" | "m/s" | "mph" | "°C" | "°F" | "º" | "yd" | "hPa";

export interface UnitMap {
  [key: string]: {metric: Unit, standard: Unit};
}

export interface IRecord {
  [key: string]: number | string | Date | IWeatherStation | IFrequency;
}

export interface IItem {
  [key: string]: string;
}

export interface ICODAPItem {
  [key: string]: any;
}

export interface IStatus {
  status: "success" | "error" | "fetching" | "station-error";
  message: string;
  icon: JSX.Element;
}
