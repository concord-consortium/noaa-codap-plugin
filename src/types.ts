// any new types should be created here...

export type IFrequency = "hourly" | "daily" | "monthly";
export type IUnits = "standard" | "metric";

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
  lat: number;
  long: number;
}

export interface IState {
  location?: IPlace;
  weatherStation?: string;
  frequency: IFrequency;
  startDate?: Date;
  endDate?: Date;
  units: IUnits;
  attributes: string[];
  filters: IFilter[];
  showModal?: "info" | "data-return-warning";
  counterToTestStateChanges: number;
}

export const DefaultState: IState = {
  frequency: "daily",
  units: "standard",
  attributes: [],
  filters: [],
  counterToTestStateChanges: 0,
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
  type: 'map',
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