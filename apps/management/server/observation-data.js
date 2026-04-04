import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import qs from 'query-string';
import { getBackupSettings } from './backup-settings.js';
import { getMainSettings } from './project-settings.js';
import { clearLog, log } from './inat-download-logger.js';

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

  // if (numResults && lastId) {
  if (lastId) {
    apiParams.id_above = lastId;
  }

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
  const tempFolder = `${backupSettings.backupFolder}/temp-raw-inat-data`;

  fs.mkdirSync(tempFolder, { recursive: true });

  const packetDataFile = path.join(tempFolder, `packet-${packetNum}.json`);
  fs.writeFileSync(packetDataFile, JSON.stringify(content), 'utf-8');

  return packetDataFile;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const writeInatDataLog = ({ totalObservations, totalPackets, completedAt, durationSeconds, success, error }) => {
  const { backupSettings } = getBackupSettings();
  const logFile = `${backupSettings.backupFolder}/inat-data-log.json`;
  const data = {
    lastRun: completedAt,
    totalObservations,
    totalPackets,
    durationSeconds,
    success,
    ...(error ? { error } : {}),
  };
  fs.writeFileSync(logFile, JSON.stringify(data, null, '  '), 'utf-8');
};

export const getInatDataLog = () => {
  const { backupSettings } = getBackupSettings();
  const logFile = `${backupSettings.backupFolder}/inat-data-log.json`;
  if (!fs.existsSync(logFile)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(logFile, { encoding: 'utf-8' }));
};

export const startInatDataDownload = async (onProgress, { maxPackets = null } = {}) => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists) {
    throw new Error('Backup settings not configured.');
  }

  const settings = getMainSettings();
  const { placeId, taxonId, curators } = settings;

  if (!placeId || !taxonId || !curators?.length) {
    throw new Error('Main settings not configured (placeId, taxonId, curators required).');
  }

  const backupFolder = backupSettings.backupFolder;
  const tempFolder = `${backupFolder}/temp-raw-inat-data`;
  const finalFolder = `${backupFolder}/raw-inat-data`;

  clearLog();
  log('info', `Starting iNat data download. placeId=${placeId}, taxonId=${taxonId}, curators=${curators}`);

  const startTime = Date.now();

  // Always start with a clean temp folder to avoid stale/corrupt files from previous runs
  if (fs.existsSync(tempFolder)) {
    fs.rmSync(tempFolder, { recursive: true, force: true });
  }
  fs.mkdirSync(tempFolder, { recursive: true });

  const curatorList = Array.isArray(curators) ? curators.join(',') : curators;

  // First packet — also gives us totalResults and numRequests
  const firstResult = await downloadDataPacket({
    curators: curatorList,
    packetNum: 1,
    placeId,
    taxonId,
    lastId: null,
    numResults: null,
  });

  if (firstResult.error) {
    log('error', `Packet 1 failed: ${firstResult.error}`);
    throw new Error(firstResult.error);
  }

  const { totalResults, numRequests } = firstResult;
  let lastId = firstResult.lastId;

  const packetLimit = maxPackets ? Math.min(maxPackets, numRequests) : numRequests;
  if (maxPackets) {
    log('info', `TEST MODE: limiting to ${packetLimit} of ${numRequests} packets.`);
  }

  log('info', `Total observations: ${totalResults}. Total packets: ${numRequests}.`);
  onProgress({ packetNum: 1, totalPackets: packetLimit, totalResults });

  for (let packetNum = 2; packetNum <= packetLimit; packetNum++) {
    await sleep(1050);

    const result = await downloadDataPacket({
      curators: curatorList,
      packetNum,
      placeId,
      taxonId,
      lastId,
      numResults: totalResults,
    });

    if (result.error) {
      log('error', `Packet ${packetNum} failed: ${result.error}`);
      throw new Error(result.error);
    }

    lastId = result.lastId;
    log('info', `Packet ${packetNum}/${numRequests} downloaded.`);
    onProgress({ packetNum, totalPackets: numRequests, totalResults });
  }

  // Swap folders: delete old final, rename temp → final
  // Skip in test mode to avoid overwriting real data
  if (maxPackets) {
    log('info', 'TEST MODE: skipping folder swap. temp-raw-inat-data has NOT replaced raw-inat-data.');
    fs.rmSync(tempFolder, { recursive: true, force: true });
  } else {
    if (fs.existsSync(finalFolder)) {
      fs.rmSync(finalFolder, { recursive: true, force: true });
    }
    fs.renameSync(tempFolder, finalFolder);
  }

  const completedAt = new Date().toISOString();
  const durationSeconds = Math.round((Date.now() - startTime) / 1000);
  log('info', `Download complete at ${completedAt}. Duration: ${durationSeconds}s.`);
  if (!maxPackets) {
    writeInatDataLog({
      totalObservations: totalResults,
      totalPackets: numRequests,
      completedAt,
      durationSeconds,
      success: true,
    });
  } else {
    log('info', 'TEST MODE: skipping inat-data-log.json update.');
  }

  return { totalObservations: totalResults, totalPackets: numRequests, completedAt };
};
