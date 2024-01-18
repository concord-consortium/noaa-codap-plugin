interface IWeatherStation {
  country: string;
  state: string;
  latitude: number;
  longitude: number;
  name: string;
  elevation: number;
  ICAO: string;
  mindate: string;
  maxdate: string;
  isdID: string;
  ranges: {
    mindate: string;
    maxdate: string;
    latitude: number;
    longitude: number;
    name: string;
    elevation: string;
    ids: {
      type: string;
      id: string;
    }[];
  }[];
  ghcndID: string;
}

declare module "*.json" {
  const value: IWeatherStation[];
  export default value;
}
