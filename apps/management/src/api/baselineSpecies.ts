import throttledQueue from 'throttled-queue';
import { INAT_API_BASE_URL } from '../constants';
import { chunk } from '../utils';
import { BaselineSpeciesInatData } from '../types';

export const getInatBaselineSpeciesData = async (ids: string): Promise<BaselineSpeciesInatData[]> => {
  const idArray = ids
    .trim()
    .split(',')
    .map((id) => id.trim());

  const chunks = chunk(idArray, 25);
  const throttle = throttledQueue(1, 1050);

  const data: BaselineSpeciesInatData[] = [];
  for (let index = 0; index < chunks.length; index++) {
    const chunkData = await throttle(() => requestSpeciesData(chunks[index]));
    data.push(...chunkData);
  }

  return data;
};

export const requestSpeciesData = async (ids: number[]) => {
  const taxonIds = ids.join(',');
  const resp = await fetch(
    `${INAT_API_BASE_URL}/taxa?taxon_id=${taxonIds}&order=desc&rank=species&order_by=observations_count`,
  );
  const json = await resp.json();

  return json.results.map(({ id, name, is_active }: any) => ({
    id,
    name,
    isActive: is_active,
  }));
};
