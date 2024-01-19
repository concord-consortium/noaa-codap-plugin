// any new types should be created here...

export type IFrequency = "hourly" | "daily" | "monthly";
export type IUnits = "standard" | "metric";

export interface AttrType {
  name: string;
  abbr: string;
  unit: {metric: string, standard: string}
}

export const unitMap = {
  angle: {metric: "º", standard: "º"},
  distance: {metric: "m", standard: "yd"},
  precipitation: {metric: "mm", standard: "in"},
  pressure: {metric: "hPa", standard: "hPa"},
  speed: {metric: "m/s", standard: "mph"},
  temperature: {metric: "°C", standard: "°F"},
};

export const dailyMonthlyAttrMap: AttrType[] = [
  {name: "Maximum temperature", abbr: "tMax", unit: unitMap.temperature},
  {name: "Minimum temperature", abbr: "tMin", unit: unitMap.temperature},
  {name: "Average temperature", abbr: "tAvg", unit: unitMap.temperature},
  {name: "Precipitation", abbr: "precip", unit: unitMap.precipitation},
  {name: "Snowfall", abbr: "snow", unit: unitMap.precipitation},
  {name: "Average windspeed", abbr: "avgWind", unit: unitMap.speed}
];

export const hourlyAttrMap = [
  {name: "Dew point", abbr: "Dew", unit: unitMap.temperature},
  {name: "Barometric pressure at sea level", abbr: "Pressure", unit: unitMap.pressure},
  {name: "Air temperature", abbr: "Temp", unit: unitMap.temperature},
  {name: "Wind direction", abbr: "WDir", unit: unitMap.angle},
  {name: "Wind speed", abbr: "WSpeed", unit: unitMap.speed},
  {name: "Precipitation in last hour", abbr: "Precip", unit: unitMap.precipitation}
];

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
  operator: "belowMean",
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
  attributes: AttrType[];
  filters: IFilter[];
  showModal?: "info" | "data-return-warning";
}

export const DefaultState: IState = {
  frequency: "daily",
  units: "standard",
  attributes: [],
  filters: [],
};

export const kStationsDatasetName = "US-Weather-Stations";
export const kStationsCollectionName = "US Weather Stations";

export const kWeatherStationCollectionAttrs = [
  { name: "name" },
  {
      name: "ICAO",
      description: "International Civil Aviation Org. Airport Code"
  },
  {
      name: "mindate",
      type: "date",
      precision: "day",
      description: "Earliest reporting date"
  },
  {
      name: "maxdate",
      type: "date",
      precision: "day",
      description: `Latest reporting date, or "present" if is an active station`
  },
  {
      name: "latitude",
      unit: "º"
  },
  {
      name: "longitude",
      unit: "º"
  },
  {
      name: "elevation",
      unit: "ft",
      precision: "0",
      type: "number"
  },
  { name: "isdID"},
  {
      name: "ghcndID",
      description: "Global Historical Climatology Network ID"
  },
  {
      name: "isActive",
      formula: `(number(maxdate="present"
                  ? date()
                  : date(split(maxdate,'-',1), split(maxdate, ""-", 2), split(maxdate, "-", 3))) - wxMinDate)>0 and wxMaxDate-number(date(split(mindate,"-",1), split(mindate, "-", 2), split(mindate, "-", 3)))>0`,
      description: "whether the station was active in the Weather Plugin's requested date range",
      _categoryMap: {
          __order: [
              "false",
              "true"
          ],
          false: "#a9a9a9",
          true: "#2a4bd7"
      },
  }
];
