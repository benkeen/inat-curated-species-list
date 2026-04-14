import fs from 'fs';
import path from 'path';
import { getBackupSettings } from './backup-settings.js';
import { getMainSettings } from './project-settings.js';

const SUMMARY_FILENAME = 'curator-review-summary.json';

type CuratorSummary = {
  generatedAt: string;
  fileCount: number;
  counts: Record<string, number>;
};

const getSummaryFilePath = (backupFolder: string): string => path.join(backupFolder, SUMMARY_FILENAME);

/**
 * Returns all curator review counts from the summary file, or null if the file doesn't exist yet.
 */
export const getCuratorSummaryCounts = (): Record<string, number> | null => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists) return null;

  const summaryFile = getSummaryFilePath(backupSettings!.backupFolder);
  if (!fs.existsSync(summaryFile)) return null;

  const summary = JSON.parse(fs.readFileSync(summaryFile, { encoding: 'utf8' })) as CuratorSummary;
  return summary.counts;
};

/**
 * Returns the curator review count for a single taxon ID, or null if the summary file doesn't exist yet.
 */
export const getCuratorReviewCount = (taxonId: string): number | null => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists) return null;

  const summaryFile = getSummaryFilePath(backupSettings!.backupFolder);
  if (!fs.existsSync(summaryFile)) return null;

  const summary = JSON.parse(fs.readFileSync(summaryFile, { encoding: 'utf8' })) as CuratorSummary;
  return summary.counts[String(taxonId)] ?? 0;
};

/**
 * Reads all packet files from the temp/inat-curated-observation-data folder, counts how many current, non-hidden curator
 * identifications exist per species taxon ID, and writes a compact summary file to the backup folder.
 * This summary is used for fast lookups without re-parsing the full raw data.
 */
export const generateCuratorSummary = (): CuratorSummary => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists) {
    throw new Error('Backup settings not configured.');
  }

  const settings = getMainSettings();
  const rawCurators = settings['curators'] as string | string[] | undefined;
  const curatorList: string[] = Array.isArray(rawCurators)
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

  const rawOmitUsers = settings['omitObservationsByUsers'] as string;
  const omitUsers = rawOmitUsers
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const rawDataFolder = path.join(backupSettings!.backupFolder, 'temp/inat-curated-observation-data');
  if (!fs.existsSync(rawDataFolder)) {
    throw new Error(`temp/inat-curated-observation-data folder not found at: ${rawDataFolder}`);
  }

  const files = fs.readdirSync(rawDataFolder).filter((f) => f.endsWith('.json'));
  const counts: Record<string, number> = {};

  type Identification = {
    user?: { login: string };
    current: boolean;
    hidden: boolean;
    taxon?: { rank: string };
    taxon_id: number;
  };

  type Observation = {
    user?: { login: string };
    identifications?: Identification[];
  };

  type PacketContent = {
    results?: Observation[];
  };

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(rawDataFolder, file), { encoding: 'utf8' })) as PacketContent;
    for (const obs of content.results ?? []) {
      if (omitUsers.includes((obs.user?.login ?? '').toLowerCase())) {
        continue;
      }
      for (const ident of obs.identifications ?? []) {
        if (
          curatorList.includes(ident.user?.login ?? '') &&
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

  const summary: CuratorSummary = {
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    counts,
  };

  fs.writeFileSync(getSummaryFilePath(backupSettings!.backupFolder), JSON.stringify(summary, null, '  '), 'utf-8');

  return summary;
};
