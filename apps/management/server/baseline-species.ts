import fs from 'fs';
import { getBackupSettings } from './backup-settings.js';

type BaselineSpeciesData = Record<string, unknown>;

type BaselineSpeciesFile = {
  validationDate: string;
  data: BaselineSpeciesData[];
};

export const getBaselineSpecies = (): unknown => {
  const { exists, backupSettings } = getBackupSettings();

  if (!exists) {
    return [];
  }

  const baselineSpecies = `${backupSettings!.backupFolder}/baseline-species.json`;
  let data: unknown = {};
  if (fs.existsSync(baselineSpecies)) {
    const content = fs.readFileSync(baselineSpecies, { encoding: 'utf8' });
    data = JSON.parse(content) as unknown;
  }

  return data;
};

export const appendBaselineSpecies = (species: BaselineSpeciesData): { success: boolean; error?: string } => {
  const { backupSettings } = getBackupSettings();
  const baselineSpeciesFile = `${backupSettings!.backupFolder}/baseline-species.json`;

  try {
    let existing: BaselineSpeciesFile = { validationDate: new Date().toISOString(), data: [] };
    if (fs.existsSync(baselineSpeciesFile)) {
      existing = JSON.parse(fs.readFileSync(baselineSpeciesFile, { encoding: 'utf8' })) as BaselineSpeciesFile;
      if (!Array.isArray(existing.data)) {
        existing.data = [];
      }
    }
    existing.data.push(species);
    fs.writeFileSync(baselineSpeciesFile, JSON.stringify(existing, null, '  '));
    return { success: true };
  } catch (_e) {
    return { success: false, error: 'There was a problem appending to the baseline species file.' };
  }
};

export const updateBaselineSpecies = (data: unknown): { success: boolean; error?: string } => {
  const { backupSettings } = getBackupSettings();

  // `data` is the raw species array. The POST endpoint passes req.body which is { data: [...] },
  // so unwrap it here if needed.
  const speciesArray = Array.isArray(data) ? data : ((data as { data?: unknown[] })?.data ?? []);

  const baselineSpeciesFile = `${backupSettings!.backupFolder}/baseline-species.json`;

  let error: string | undefined;
  let success = false;
  try {
    const baselineData = {
      validationDate: new Date(),
      data: speciesArray,
    };

    fs.writeFileSync(baselineSpeciesFile, JSON.stringify(baselineData, null, '  '));
    success = true;
  } catch (_e) {
    error = 'There was a problem writing to the baseline species file.';
  }

  return {
    success,
    error,
  };
};

export const patchCuratorReviewCounts = (counts: Record<string, number>): void => {
  const { backupSettings } = getBackupSettings();
  const baselineSpeciesFile = `${backupSettings!.backupFolder}/baseline-species.json`;

  if (!fs.existsSync(baselineSpeciesFile)) return;

  const parsed = JSON.parse(fs.readFileSync(baselineSpeciesFile, { encoding: 'utf8' })) as BaselineSpeciesFile;

  if (!Array.isArray(parsed.data)) return;

  parsed.data = parsed.data.map((species) => ({
    ...species,
    curatorReviewCount: counts[String(species['id'])] ?? 0,
  }));

  fs.writeFileSync(baselineSpeciesFile, JSON.stringify(parsed, null, '  '));
};
