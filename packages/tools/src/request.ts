/**
 * This file contains a various methods for parsing and minify iNat data.
 */
import qs from 'query-string';
import fetch from 'node-fetch';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import throttledQueue from 'throttled-queue';
import { Logger } from 'winston';

import { formatNum } from './helpers';
import { INAT_API_URL, INAT_REQUEST_RESULTS_PER_PAGE } from './constants';
import {
  DownloadDataPacketResponse,
  DownloadDataPacketArgs,
  GetDataPacketResponse,
  INatApiObsRequestParams,
  GeneratorConfig,
} from '../types/generator.types';
import { logPacket } from './logs';

let lastId: number | null = null;
let numResults = 0;
let numRequests = 0;

/**
 * This method:
 * - Downloads the data from iNat into temp storage files
 * - logs all events in a log file
 * - provides a command-line visualization to show how the progress goes
 */
export const downloadDataPackets = async (config: GeneratorConfig, tempFolder: string, logger: Logger) => {
  const { curators, placeId, taxonId } = config;

  // used for visualizing the download process
  const progress = new cliProgress.SingleBar({
    format: 'Download progress |' + colors.green('{bar}') + '| {percentage}% || {value}/{total} requests',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  // limit the requests to iNat to be one per second (plus extra 50ms). Their API forbids anything more and will
  // reject too many requests coming from the same source
  const throttle = throttledQueue(1, 1050);
  const curatorList = curators.join(',');

  // do our initial request. This is the only request that returns the total number of results in the result set. Once
  // we get the data back, initialize the progress bar and kick off all the remaining requests within our request throttler
  const { totalResults, numRequests } = await throttle<DownloadDataPacketResponse>(() =>
    downloadDataPacket({
      curators: curatorList,
      placeId,
      taxonId,
      packetNum: 1,
      tempFolder,
      logger,
    }),
  );

  if (totalResults === 0) {
    logger.log('error', 'No observations found.');
    throw new Error('No observations found.');
  }

  if (numRequests === 1) {
    logger.log('info', `All observations (${totalResults}) have been retrieved with this request.`);
  } else {
    logger.log(
      'info',
      `${numRequests} requests will need to be made to retrieve all ${formatNum(totalResults)} observations`,
    );
  }

  progress.start(numRequests, 1);

  // this processes each request sequentially to prevent too many requests to the iNat server
  try {
    for (let packetNum = 2; packetNum <= numRequests; packetNum++) {
      const { totalResults } = await throttle(() =>
        downloadDataPacket({
          curators: curatorList,
          placeId,
          taxonId,
          packetNum,
          tempFolder,
          logger,
        }),
      );
      logger.log('info', `Packet num ${formatNum(packetNum)}, results left to retrieve: ${formatNum(totalResults)}`);
      progress.update(packetNum);
    }
  } catch (e) {
    progress.stop();
    const message = e instanceof Error ? e.message : String(e);
    console.error(`\n\n  ERROR: iNat request failed — ${message}`);
    console.error(`  Check the log file in the temp folder for details.\n`);
    throw e;
  }

  logger.log('info', 'All data downloaded');

  progress.stop();

  return numRequests;
};

// TODO
export const resetData = () => {
  // curatedSpeciesData = {};
  // newAdditions = {};
  numResults = 0;
};

/**
 * Simple high-level method that just downloads a chunk of data from iNat and stores the result in a temporary file on disk.
 * Later steps parse, convert and minify the relevant data.
 */
export const downloadDataPacket = async ({
  curators,
  packetNum,
  placeId,
  taxonId,
  tempFolder,
  logger,
}: DownloadDataPacketArgs): Promise<DownloadDataPacketResponse> => {
  let rawResponse;
  try {
    rawResponse = await getDataPacket(placeId, taxonId, curators, logger);
  } catch (e) {
    const message = e instanceof Error ? e.message : JSON.stringify(e);
    logger.log('error', `request error: ${message}`);
    logger.log('debug', `resume transaction data: ${JSON.stringify({ curators, placeId, taxonId, lastId })}`);
    throw e;
  }

  const resp: any = (await rawResponse.json()) as GetDataPacketResponse;
  const totalResults = resp.total_results;

  logger.log('info', 'request successful');

  if (totalResults <= 0) {
    return {
      totalResults,
      numRequests,
    };
  } else {
    if (!numResults) {
      numResults = totalResults;
      numRequests = Math.ceil(totalResults / INAT_REQUEST_RESULTS_PER_PAGE);
    }
  }

  // write the entire API response to a file. We'll extract what we need once the data's fully downloaded
  const packetDataFile = logPacket(packetNum, tempFolder, resp);
  logger.log('info', `data stored in file: ${packetDataFile}`);
  logger.log('info', `total results: ${formatNum(totalResults)}`);

  // the iNat API works by passing in a property to return data above a particular ID. This tracks it for subsequent requests
  lastId = resp.results[resp.results.length - 1].id;

  return {
    totalResults,
    numRequests,
  };
};

/**
 * Performs a single request to the iNat API.
 */
export const getDataPacket = async (placeId: number, taxonId: number, curators: string, logger: Logger) => {
  const apiParams: INatApiObsRequestParams = {
    place_id: placeId,
    taxon_id: taxonId,
    order: 'asc',
    order_by: 'id',
    per_page: INAT_REQUEST_RESULTS_PER_PAGE,
    verifiable: 'any',
    ident_user_id: curators,
  };

  // refactor
  if (numResults && lastId) {
    apiParams.id_above = lastId;
  }

  const paramsStr = qs.stringify(apiParams);
  const apiUrl = `${INAT_API_URL}?${paramsStr}`;

  logger.log('info', `Request: ${apiUrl}`);

  return fetch(apiUrl);
};
