import fs from 'fs';
import path from 'path';
import { getBackupSettings } from './backup-settings.js';
import { getMainSettings } from './project-settings.js';

const SUMMARY_FILENAME = 'curator-review-summary.json';

const getSummaryFilePath = (backupFolder) => path.join(backupFolder, SUMMARY_FILENAME);

/**
 * Returns the curator review count for a single taxon ID, or null if the summary file doesn't exist yet.
 */
export const getCuratorReviewCount = (taxonId) => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists) return null;

  const summaryFile = getSummaryFilePath(backupSettings.backupFolder);
  if (!fs.existsSync(summaryFile)) return null;

  const summary = JSON.parse(fs.readFileSync(summaryFile, { encoding: 'utf8' }));
  return summary.counts[String(taxonId)] ?? 0;
};

/**
 * Reads all packet files from the raw-inat-data folder, counts how many current, non-hidden curator
 * identifications exist per species taxon ID, and writes a compact summary file to the backup folder.
 * This summary is used for fast lookups without re-parsing the full raw data.
 */
export const generateCuratorSummary = () => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists) {
    throw new Error('Backup settings not configured.');
  }

  const settings = getMainSettings();
  const rawCurators = settings.curators;
  const curatorList = Array.isArray(rawCurators)
    ? rawCurators
    : typeof rawCurators === 'string' && rawCurators.trim()
      ? rawCurators
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  if (!curatorList.length) {
    throw new Error('No curators configured in main settings.');
  }

  const rawDataFolder = path.join(backupSettings.backupFolder, 'raw-inat-data');
  if (!fs.existsSync(rawDataFolder)) {
    throw new Error(`raw-inat-data folder not found at: ${rawDataFolder}`);
  }

  const files = fs.readdirSync(rawDataFolder).filter((f) => f.endsWith('.json'));
  const counts = {};

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(rawDataFolder, file), { encoding: 'utf8' }));
    for (const obs of content.results ?? []) {
      for (const ident of obs.identifications ?? []) {
        if (
          curatorList.includes(ident.user?.login) &&
          ident.current === true &&
          !ident.hidden &&
          ident.taxon?.rank === 'species'
        ) {
          const taxonId = String(ident.taxon_id);
          counts[taxonId] = (counts[taxonId] ?? 0) + 1;
        }
      }
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    counts,
  };

  fs.writeFileSync(getSummaryFilePath(backupSettings.backupFolder), JSON.stringify(summary, null, '  '), 'utf-8');

  return summary;
};
