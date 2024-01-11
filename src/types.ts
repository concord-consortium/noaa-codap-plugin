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
  startDate?: string;
  endDate?: string;
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
