import type { GeneratorConfig } from '@ecophilia/inat-curated-species-list-tools';
import throttledQueue from 'throttled-queue';

import { getApiUrl } from './api';

export type DownloadDataPacketResponse = {
  readonly totalResults: number;
  readonly numRequests: number;
};

// let lastId: number | null = null;
let numResults = 0;
// let numRequests = 0;

/**
 * This method:
 * - Downloads the data from iNat into temp storage files
 * - logs all events in a log file
 */
export const downloadDataPackets = async (config: GeneratorConfig) => {
  const { curators, placeId, taxonId } = config;

  // used for visualizing the download process
  //   const progress = new cliProgress.SingleBar({
  //     format: 'Download progress |' + colors.green('{bar}') + '| {percentage}% || {value}/{total} requests',
  //     barCompleteChar: '\u2588',
  //     barIncompleteChar: '\u2591',
  //     hideCursor: true,
  //   });

  // limit the requests to iNat to be one per second (plus extra 50ms). Their API forbids anything more and will
  // reject too many requests coming from the same source
  const throttle = throttledQueue(1, 1050);
  const curatorList = curators.join(',');

  // do our initial request. This is the only request that returns the total number of results in the result set. Once
  // we get the data back, initialize the progress bar and kick off all the remaining requests within our request throttler
  // @ts-ignore
  const { totalResults, numRequests, lastId } = await throttle<DownloadDataPacketResponse>(() => {
    return fetch(getApiUrl('obs-data'), {
      method: 'GET',
      body: JSON.stringify({
        curators: curatorList,
        placeId,
        taxonId,
        packetNum: 1,
      }),
    });
  });

  console.log({ totalResults, numResults, lastId });

  // if (totalResults === 0) {
  //   logger.log('error', 'No observations found.');
  //   return;
  // }

  // if (numRequests === 1) {
  //   logger.log('info', `All observations (${totalResults}) have been retrieved with this request.`);
  // } else {
  //   logger.log(
  //     'info',
  //     `${numRequests} requests will need to be made to retrieve all ${formatNum(totalResults)} observations`,
  //   );
  // }

  // progress.start(numRequests, 1);

  // // this processes each request sequentially to prevent too many requests to the iNat server
  // for (let packetNum = 2; packetNum <= numRequests; packetNum++) {
  //   const { totalResults } = await throttle(() =>
  //     downloadDataPacket({
  //       curators: curatorList,
  //       placeId,
  //       taxonId,
  //       packetNum,
  //       tempFolder,
  //       logger,
  //     }),
  //   );
  //   logger.log('info', `Packet num ${formatNum(packetNum)}, results left to retrieve: ${formatNum(totalResults)}`);
  //   progress.update(packetNum);
  // }

  // logger.log('info', 'All data downloaded');

  // progress.stop();

  return numRequests;
};
