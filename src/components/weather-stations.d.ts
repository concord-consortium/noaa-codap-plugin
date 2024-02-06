import { IWeatherStation } from "../types";

declare module "*.json" {
  const value: IWeatherStation[];
  export default value;
}
