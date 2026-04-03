import throttledQueue from 'throttled-queue';
import { getApiUrl } from '../../api/api';

export const PURGE_STATE = 'PURGE_STATE';
export const purgeState = () => ({
  type: PURGE_STATE,
});

export const requestInatObservations =
  ({ placeId, taxonId, curators }: any) =>
  async () => {
    const throttle = throttledQueue(1, 1050);

    // do our initial request. This is the only request that returns the total number of results in the result set. Once
    // we get the data back, initialize the progress bar and kick off all the remaining requests within our request throttler
    // @ts-ignore
    const { totalResults, numRequests, lastId } = await throttle<DownloadDataPacketResponse>(() =>
      getObservationData({ placeId, taxonId, curators }),
    );

    console.log({ totalResults, lastId });
  };

const getObservationData = async ({ placeId, taxonId, curators }: any) => {
  const curatorList = curators.join(',');

  const url = getApiUrl('obs-data');
  const resp = await fetch(`${url}?curators=${curatorList}&placeId=${placeId}&taxonId=${taxonId}`);
  const data = await resp.json();

  console.log(data);
};
