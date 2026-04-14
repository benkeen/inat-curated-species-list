import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { getBackupSettings } from './backup-settings.js';

export type QueuedChanges = {
  generatedAt: string;
  /** Total species count in current working-tree species-data-full.json */
  currentSpeciesCount: number;
  /** Total species count in last committed species-data-full.json (null if never committed) */
  committedSpeciesCount: number | null;
  /** Net change: current - committed */
  speciesCountDiff: number | null;
  /** Species names present in current but not in last commit */
  addedSpecies: string[];
  /** Species names present in last commit but not in current */
  removedSpecies: string[];
  /** Baseline entries present in current but not in last commit */
  addedBaselineSpecies: string[];
  /** Baseline entries present in last commit but not in current */
  removedBaselineSpecies: string[];
};

/**
 * Runs git show HEAD:<relPath> inside backupFolder.
 * Returns parsed JSON or null if the file was never committed or git fails.
 */
function getCommittedJson(backupFolder: string, relPath: string): unknown | null {
  const result = spawnSync('git', ['show', `HEAD:${relPath}`], {
    cwd: backupFolder,
    encoding: 'utf-8',
    maxBuffer: 100 * 1024 * 1024,
  });

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

/**
 * Extracts the list of species names from a full (non-minified) species-data-full.json.
 * The file is a Record<taxonId, { data: TaxonomyMap, count: number }> where TaxonomyMap
 * is a rank→name map and the species name lives at data.species.
 */
function extractSpeciesNames(speciesData: unknown): string[] {
  if (!speciesData || typeof speciesData !== 'object' || Array.isArray(speciesData)) {
    return [];
  }

  return Object.values(speciesData as Record<string, { data?: Record<string, string> }>)
    .map((entry) => entry?.data?.['species'] ?? '')
    .filter(Boolean);
}

/**
 * Extracts baseline species names from baseline-species.json `data` array.
 */
function extractBaselineNames(baselineData: unknown): string[] {
  if (
    !baselineData ||
    typeof baselineData !== 'object' ||
    !Array.isArray((baselineData as Record<string, unknown>)['data'])
  ) {
    return [];
  }

  return (baselineData as { data: { name?: string }[] }).data.map((e) => e.name ?? '').filter(Boolean);
}

export const generateQueuedChanges = (): QueuedChanges => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    throw new Error('Backup settings not configured.');
  }

  const backupFolder = backupSettings.backupFolder;

  // Read current on-disk files
  const speciesDataPath = path.join(backupFolder, 'species-data-full.json');
  const baselinePath = path.join(backupFolder, 'baseline-species.json');

  const currentSpeciesRaw = fs.existsSync(speciesDataPath)
    ? JSON.parse(fs.readFileSync(speciesDataPath, 'utf-8'))
    : null;
  const currentBaselineRaw = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf-8')) : null;

  // Read last-committed versions via git
  const committedSpeciesRaw = getCommittedJson(backupFolder, 'species-data-full.json');
  const committedBaselineRaw = getCommittedJson(backupFolder, 'baseline-species.json');

  // Extract name lists
  const currentSpeciesNames = new Set(extractSpeciesNames(currentSpeciesRaw));
  const committedSpeciesNames = new Set(extractSpeciesNames(committedSpeciesRaw));
  const currentBaselineNames = new Set(extractBaselineNames(currentBaselineRaw));
  const committedBaselineNames = new Set(extractBaselineNames(committedBaselineRaw));

  const addedSpecies = [...currentSpeciesNames].filter((n) => !committedSpeciesNames.has(n)).sort();
  const removedSpecies = [...committedSpeciesNames].filter((n) => !currentSpeciesNames.has(n)).sort();
  const addedBaselineSpecies = [...currentBaselineNames].filter((n) => !committedBaselineNames.has(n)).sort();
  const removedBaselineSpecies = [...committedBaselineNames].filter((n) => !currentBaselineNames.has(n)).sort();

  const currentSpeciesCount = currentSpeciesNames.size;
  const committedSpeciesCount = committedSpeciesRaw !== null ? committedSpeciesNames.size : null;
  const speciesCountDiff = committedSpeciesCount !== null ? currentSpeciesCount - committedSpeciesCount : null;

  const result: QueuedChanges = {
    generatedAt: new Date().toISOString(),
    currentSpeciesCount,
    committedSpeciesCount,
    speciesCountDiff,
    addedSpecies,
    removedSpecies,
    addedBaselineSpecies,
    removedBaselineSpecies,
  };

  // Write to temp/queued-changes.json
  const tempDir = path.join(backupFolder, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  fs.writeFileSync(path.join(tempDir, 'queued-changes.json'), JSON.stringify(result, null, '\t'), 'utf-8');

  return result;
};

export const getQueuedChanges = (): QueuedChanges | null => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return null;
  }

  const filePath = path.join(backupSettings.backupFolder, 'temp', 'queued-changes.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as QueuedChanges;
  } catch {
    return null;
  }
};
