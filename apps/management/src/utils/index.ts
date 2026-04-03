import { BaselineSpeciesInatData } from '../types';

export const chunk = (arr: any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_v, i) => arr.slice(i * size, i * size + size));

export const combineSpeciesLists = (listA: BaselineSpeciesInatData[], listB: BaselineSpeciesInatData[]) => {
  const newList: BaselineSpeciesInatData[] = [...listA];

  const existingIds = newList.map(({ id }) => id);
  listB.forEach((row) => {
    if (!existingIds.includes(row.id)) {
      newList.push(row);
    }
  });

  return newList;
};

export const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
