import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import qs from 'query-string';
import { getBackupSettings } from './backup-settings.js';

const INAT_REQUEST_RESULTS_PER_PAGE = 200;
const INAT_API_URL = 'https://api.inaturalist.org/v1/observations';

/**
 * Simple high-level method that just downloads a chunk of data from iNat and stores the result in a temporary file on disk.
 * Later steps parse, convert and minify the relevant data.
 */
export const downloadDataPacket = async ({ curators, packetNum, placeId, taxonId, numResults, lastId }) => {
  let rawResponse;
  try {
    rawResponse = await getDataPacket(placeId, taxonId, curators, numResults, lastId);
  } catch (e) {
    // logger.log('error', `request error: ${JSON.stringify(e)}`);
    // logger.log('debug', `resume transaction data: ${JSON.stringify({ curators, placeId, taxonId, lastId })}`);
    // process.exit(1);
    return {
      error: JSON.stringify(e),
    };
  }

  const resp = await rawResponse.json();
  const totalResults = resp.total_results;

  // logger.log('info', 'request successful');
  let numRequests = 0;
  if (totalResults <= 0) {
    return {
      totalResults,
      numRequests,
    };
  } else {
    numRequests = Math.ceil(totalResults / INAT_REQUEST_RESULTS_PER_PAGE);
  }

  // write the entire API response to a file. We'll extract what we need once the data's fully downloaded
  const packetDataFile = logPacket(packetNum, resp);

  // logger.log('info', `data stored in file: ${packetDataFile}`);
  // logger.log('info', `total results: ${formatNum(totalResults)}`);

  // the iNat API works by passing in a property to return data above a particular ID. This tracks it for subsequent requests
  lastId = resp.results[resp.results.length - 1].id;

  return {
    totalResults,
    numRequests,
    lastId,
  };
};

/**
 * Performs a single request to the iNat API.
 */
export const getDataPacket = async (placeId, taxonId, curators, numResults, lastId) => {
  const apiParams = {
    place_id: placeId,
    taxon_id: taxonId,
    order: 'asc',
    order_by: 'id',
    per_page: INAT_REQUEST_RESULTS_PER_PAGE,
    verifiable: 'any',
    ident_user_id: curators,
  };

  // refactor
  // if (numResults && lastId) {
  //   apiParams.id_above = lastId;
  // }

  const paramsStr = qs.stringify(apiParams);
  const apiUrl = `${INAT_API_URL}?${paramsStr}`;

  // logger.log('info', `Request: ${apiUrl}`);

  return fetch(apiUrl);
};

export const getBaselineSpecies = () => {
  const { exists, backupSettings } = getBackupSettings();

  if (!exists) {
    return [];
  }

  const baselineSpecies = `${backupSettings.backupFolder}/baseline-species.json`;
  let data = {};
  if (fs.existsSync(baselineSpecies)) {
    const content = fs.readFileSync(baselineSpecies, { encoding: 'utf8' });
    data = JSON.parse(content);
  }

  return data;
};

export const logPacket = (packetNum, content) => {
  const { backupSettings } = getBackupSettings();
  const tempFolder = `${backupSettings.backupFolder}/temp-raw-inat-data/packet-${packetNum}.json`;

  fs.mkdirSync(tempFolder, { recursive: true });

  const packetDataFile = path.resolve(tempFolder, `packet-${packetNum}.json`);
  fs.writeFileSync(packetDataFile, JSON.stringify(content), 'utf-8');

  return packetDataFile;
};
