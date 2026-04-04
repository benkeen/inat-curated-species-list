import fs from 'fs';
import { getBackupSettings } from './backup-settings.js';

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
