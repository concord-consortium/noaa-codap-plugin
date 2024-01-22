export type IFrequency = "hourly" | "daily" | "monthly";
export type IUnits = "standard" | "metric";

export interface AttrType {
  name: string;
  abbr: string;
  unit: {metric: string, standard: string}
}

export interface IBaseFilter {
  attribute: string;
}
export interface IEqualsFilter extends IBaseFilter {
  operator: "equals",
  value: number
}
export interface DoesNotEqualFilter extends IBaseFilter {
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
  lowerValue: number
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
  operator: "aboveMean",
}
export type IFilter = IEqualsFilter | DoesNotEqualFilter | IGreaterThanFilter | IGreaterThanOrEqualToFilter | ILessThanFilter | ILessThanOrEqualToFilter | IBetweenFilter | ITopFilter | IBottomFilter | IAboveMeanFilter | IBelowMeanFilter;

export interface IPlace {
  name: string;
  latitude: number;
  longitude: number;
}

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
  mindate: string | number;
  maxdate: string | number;
  latitude: number;
  longitude: number;
  name: string;
  elevation?: string | number;
  ids: IWeatherStationID[];
}

interface IWeatherStationID {
  type: string;
  id: string;
}

export interface IState {
  location?: IPlace;
  weatherStation?: IWeatherStation;
  weatherStationDistance?: number;
  frequency: IFrequency;
  startDate?: Date;
  endDate?: Date;
  units: IUnits;
  attributes: string[];
  filters: IFilter[];
  showModal?: "info" | "data-return-warning";
  stationTimezoneOffset?: number;
  stationTimezoneName?: string;
}

export const DefaultState: IState = {
  frequency: "daily",
  units: "standard",
  attributes: [],
  filters: [],
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
