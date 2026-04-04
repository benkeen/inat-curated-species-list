import fs from 'fs';
import { getBackupSettings } from './backup-settings.js';

export const getMainSettings = (): Record<string, unknown> => {
  const { exists, backupSettings } = getBackupSettings();

  if (!exists) {
    return {};
  }

  const settingsFile = `${backupSettings!.backupFolder}/project-settings.json`;
  let settings: { main?: Record<string, unknown> } = {};
  if (fs.existsSync(settingsFile)) {
    const content = fs.readFileSync(settingsFile, { encoding: 'utf8' });
    settings = JSON.parse(content) as { main?: Record<string, unknown> };
  }

  return settings.main ?? {};
};

export const updateMainSettings = (data: Record<string, unknown>): { success: boolean } => {
  const { backupSettings } = getBackupSettings();

  const settingsFile = `${backupSettings!.backupFolder}/project-settings.json`;
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(settingsFile)) {
    const content = fs.readFileSync(settingsFile, { encoding: 'utf8' });
    existing = JSON.parse(content) as Record<string, unknown>;
  }
  fs.writeFileSync(settingsFile, JSON.stringify({ ...existing, main: data }, null, '  '));

  return {
    success: true,
  };
};
