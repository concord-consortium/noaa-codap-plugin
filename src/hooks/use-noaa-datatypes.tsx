import { useEffect, useState } from 'react';
import {
  kUnitTypeAngle,
  kUnitTypeDistance,
  kUnitTypePrecip,
  kUnitTypePressure,
  kUnitTypeSpeed,
  kUnitTypeTemp
} from '../constants';
import { ConverterMap, Unit, UnitMap } from '../types';
import { useStateContext } from './use-state';

interface NoaaType {
  sourceName: string;
  name: string;
  units: { metric: Unit; standard: Unit };
  description: string;
  datasetList: string[];
  decode?: { [key: string]: (value: any) => number | undefined };
  convertUnits: null | ((fromUnit: Unit, toUnit: Unit, value: number) => number);
  isInDataSet(dataSet: string): boolean;
}

interface DataTypeStore {
  findAllBySourceName: (targetName: string) => NoaaType[];
  findByName: (targetName: string) => NoaaType | undefined;
  findAllByNoaaDataset: (noaaDatasetName: string) => NoaaType[];
  findAll: () => NoaaType[];
}

export const useNoaaDataTypes = () => {
  const { state } = useStateContext();
  const [dataTypes, setDataTypes] = useState<NoaaType[]>([]);
  const { attributes } = state;

  useEffect(() => {

  }, [attributes]);

  const dataTypeStore: DataTypeStore = {
    findAllBySourceName: (targetName: string) =>
      dataTypes.filter((dataType) => targetName === dataType.sourceName),
    findByName: (targetName: string) =>
      dataTypes.find((dataType) => targetName === dataType.name),
    findAllByNoaaDataset: (noaaDatasetName: string) =>
      dataTypes.filter((noaaType) => noaaType.isInDataSet(noaaDatasetName)),
    findAll: () => dataTypes,
  };

  return { dataTypeStore };
};

